// =====================================================================
// 외부 백엔드 SQL 실행 API 연동
// =====================================================================
// FastAPI 백엔드 명세:
//   POST {endpoint}
//   Body: { "sql": "<SQL 쿼리>" }
//   200: JSON Array<Record<string, any>>
//   500: { "detail": "<에러 메시지>" }
// =====================================================================

import type { QueryResult } from "./mock-data";

const STORAGE_KEY = "sql_api_endpoint";
export const DEFAULT_ENDPOINT =
  (import.meta.env.VITE_SQL_API_URL as string | undefined) ??
  "http://127.0.0.1:8000/execute-sql";

// =====================================================================
// SQL 생성 에이전트 (Self-Healing)
// =====================================================================
// 백엔드(SQLite)의 detail 메시지를 분석하여 SQL을 재작성한다.
// 실제 LLM 호출 없이도 흔한 SQLite 에러 패턴을 잡아낼 수 있도록 다단계
// 휴리스틱을 적용한다. 동일 SQL이 반환되면 호출부가 루프를 중단한다.
export function regenerateSqlFromError(sql: string, detail: string): string {
  let s = sql;
  const d = (detail || "").toLowerCase();

  // 1) 트레일링 세미콜론 / 화이트스페이스 정리
  s = s.trim().replace(/;+\s*$/g, "");

  // 2) PostgreSQL 전용 함수 → SQLite 변환
  if (/no such function:\s*to_char/.test(d) || /to_char/i.test(s)) {
    s = s.replace(
      /to_char\(\s*([\w\."]+)\s*,\s*'YYYY-MM-DD'\s*\)/gi,
      "strftime('%Y-%m-%d', $1)",
    );
    s = s.replace(
      /to_char\(\s*([\w\."]+)\s*,\s*'YYYY-MM'\s*\)/gi,
      "strftime('%Y-%m', $1)",
    );
    s = s.replace(
      /to_char\(\s*([\w\."]+)\s*,\s*'YYYY'\s*\)/gi,
      "strftime('%Y', $1)",
    );
  }
  if (/date_trunc/i.test(s) || /no such function:\s*date_trunc/.test(d)) {
    s = s.replace(
      /date_trunc\(\s*'month'\s*,\s*([\w\."]+)\s*\)/gi,
      "strftime('%Y-%m', $1)",
    );
    s = s.replace(
      /date_trunc\(\s*'day'\s*,\s*([\w\."]+)\s*\)/gi,
      "strftime('%Y-%m-%d', $1)",
    );
  }
  if (/extract\s*\(/i.test(s)) {
    s = s.replace(
      /extract\(\s*year\s+from\s+([\w\."]+)\s*\)/gi,
      "strftime('%Y', $1)",
    );
    s = s.replace(
      /extract\(\s*month\s+from\s+([\w\."]+)\s*\)/gi,
      "strftime('%m', $1)",
    );
  }

  // 3) 식별자 따옴표 (PostgreSQL " → SQLite는 보통 무따옴표)
  if (/no such column|no such table|near "/.test(d)) {
    s = s.replace(/"/g, "");
  }

  // 4) ILIKE → LIKE (SQLite 미지원)
  if (/ilike/i.test(s) || /no such function:\s*ilike/.test(d)) {
    s = s.replace(/\bILIKE\b/gi, "LIKE");
  }

  // 5) LIMIT 누락 시 안전 LIMIT 부여 (행 폭주 방지)
  if (/result too large|too many rows/.test(d) && !/\blimit\s+\d+/i.test(s)) {
    s = `${s} LIMIT 1000`;
  }

  // 6) GROUP BY 누락 (집계 + 비집계 컬럼 혼합 에러)
  if (/aggregate|group by/.test(d)) {
    // 단순 보강: SELECT의 첫 번째 비집계 컬럼을 GROUP BY로 추가
    const m = s.match(/select\s+([\s\S]+?)\s+from/i);
    if (m && !/group\s+by/i.test(s)) {
      const firstCol = m[1].split(",")[0].trim().split(/\s+as\s+/i)[0].trim();
      if (firstCol && !/\(/.test(firstCol)) {
        s = s.replace(/(order\s+by|limit|$)/i, `GROUP BY ${firstCol} $1`);
      }
    }
  }

  return s.trim();
}

export function getEndpoint(): string {
  if (typeof window === "undefined") return DEFAULT_ENDPOINT;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_ENDPOINT;
}

export function setEndpoint(url: string) {
  if (typeof window === "undefined") return;
  if (url) localStorage.setItem(STORAGE_KEY, url);
  else localStorage.removeItem(STORAGE_KEY);
}

export type ExecResponse =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; status: number; detail: string };

export async function executeSql(sql: string, signal?: AbortSignal): Promise<ExecResponse> {
  const endpoint = getEndpoint();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
      signal,
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") detail = body.detail;
        else detail = JSON.stringify(body);
      } catch {
        try {
          detail = (await res.text()) || detail;
        } catch {
          /* noop */
        }
      }
      return { ok: false, status: res.status, detail };
    }
    const data = await res.json();
    const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
    return { ok: true, rows };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: 0,
      detail: `네트워크 오류: ${msg}. (Mixed Content 차단 가능성 — HTTPS 터널을 사용하거나 CORS를 확인하세요.)`,
    };
  }
}

// ----- 응답 → QueryResult 자동 매핑 (수치/문자 컬럼 감지) -----
type ChartType = QueryResult["chart"]["type"];

export function buildResultFromRows(
  intent: string,
  sql: string,
  rows: Record<string, unknown>[],
): QueryResult {
  if (!rows.length) {
    return {
      intent,
      sql,
      columns: [],
      rows: [],
      chart: { type: "bar", title: "결과 없음", x: [], y: [] },
      insight: "쿼리는 정상적으로 실행됐지만 반환된 행이 없습니다.",
    };
  }

  const sample = rows[0];
  const keys = Object.keys(sample);
  const numericKeys = keys.filter((k) => rows.every((r) => typeof r[k] === "number" || r[k] === null));
  const stringKeys = keys.filter((k) => !numericKeys.includes(k));

  const xKey = stringKeys[0] ?? keys[0];
  const yKey = numericKeys[0] ?? keys.find((k) => k !== xKey) ?? keys[0];

  // 차트 타입 추론
  let chartType: ChartType = "bar";
  const xVals = rows.map((r) => r[xKey] as string | number);
  const looksTime =
    typeof xVals[0] === "string" &&
    /^\d{4}([-/]\d{1,2}){0,2}$/.test(String(xVals[0]));
  if (looksTime) chartType = "line";
  else if (numericKeys.length >= 2 && stringKeys.length === 0) chartType = "scatter";

  const columns = keys.map((k) => ({ key: k, label: k }));
  const safeRows = rows.map((r) => {
    const o: Record<string, string | number> = {};
    for (const k of keys) {
      const v = r[k];
      o[k] = typeof v === "number" || typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
    }
    return o;
  });

  const yVals = rows.map((r) => Number(r[yKey] ?? 0));
  const total = yVals.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const top = safeRows.reduce(
    (best, row) => (Number(row[yKey]) > Number(best[yKey] ?? -Infinity) ? row : best),
    safeRows[0],
  );

  return {
    intent,
    sql,
    columns,
    rows: safeRows,
    chart: {
      type: chartType,
      title: `${yKey} by ${xKey}`,
      x: xVals,
      y: yVals,
      name: yKey,
    },
    insight: `**${rows.length}건**의 결과가 반환되었습니다.
- 기준 컬럼: \`${xKey}\` / 측정 컬럼: \`${yKey}\`
- 최댓값: **${String(top?.[xKey])}** — ${Number(top?.[yKey]).toLocaleString()}
- 합계: **${total.toLocaleString()}**`,
  };
}
