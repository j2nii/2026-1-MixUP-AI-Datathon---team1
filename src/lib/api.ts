// =====================================================================
// API 레이어
//
// DB 스키마/SQL 실행: dataset.py FastAPI 서버 (VITE_SQL_API_URL 기준)
//   기본값: http://127.0.0.1:8000  (uvicorn dataset:app)
//
// 분석 쿼리/KPI: VITE_API_KEY + VITE_API_BASE_URL 모두 설정 시 실제 API,
//               미설정 시 목업 데이터 사용
// =====================================================================

import type { Table, Kpi, QueryResult } from "./types";
import { mockKpis } from "@/data/kpis";
import { runMockQuery, mockDefaultQuery } from "./mock-queries";
import { suggestedPrompts } from "@/data/suggested-prompts";

// dataset.py 프록시 경로 (Vite dev: /api → 127.0.0.1:8000, 배포 시 실제 URL로 교체)
const DATASET_BASE = (import.meta.env.VITE_DATASET_URL as string | undefined) ?? "/api";

const API_KEY = (import.meta.env.VITE_API_KEY as string) ?? "";
const API_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "";
const USE_REAL = API_KEY !== "" && API_URL !== "";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  };
}

// ── DB 스키마 (dataset.py GET /schema) ───────────────────────────────
export async function fetchSchema(): Promise<Table[]> {
  const res = await fetch(`${DATASET_BASE}/schema`);
  if (!res.ok) throw new Error(`/schema ${res.status}`);
  return res.json();
}

// ── KPI ───────────────────────────────────────────────────────────────
// 실제 API: GET /kpis  →  Kpi[]
export async function fetchKpis(): Promise<Kpi[]> {
  if (!USE_REAL) return mockKpis;
  const res = await fetch(`${API_URL}/kpis`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`/kpis ${res.status}`);
  return res.json();
}

// ── 자연어 분석 (차트 생성) ───────────────────────────────────────────
// 실제 API: POST /analyze  { prompt }  →  QueryResult
export async function analyzePrompt(
  prompt: string,
  signal?: AbortSignal,
): Promise<QueryResult> {
  if (!USE_REAL) return runMockQuery(prompt);
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const b = await res.json(); detail = b?.detail ?? JSON.stringify(b); } catch { /* noop */ }
    throw new Error(detail);
  }
  const data = await res.json();
  return {
    intent:  data.intent  ?? prompt,
    sql:     data.sql     ?? "",
    columns: data.columns ?? [],
    rows:    data.rows    ?? [],
    chart:   data.chart,
    insight: data.insight ?? `**${(data.rows ?? []).length}건** 반환됐습니다.`,
  };
}

export { suggestedPrompts, mockDefaultQuery as defaultQuery };
export type { Table, Kpi, QueryResult };
