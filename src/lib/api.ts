// =====================================================================
// API 레이어 — mock ↔ 실제 API 전환점
//
// 실제 API 연결 방법:
//   .env 파일에 아래 두 줄 추가
//   VITE_API_KEY=your-api-key
//   VITE_API_BASE_URL=https://your-api.com
//
// 두 값이 모두 있으면 실제 API를, 없으면 목업 데이터를 사용합니다.
// =====================================================================

import type { Table, Kpi, QueryResult } from "./types";
import { mockSchema } from "@/data/schema";
import { mockKpis } from "@/data/kpis";
import { runMockQuery, mockDefaultQuery } from "./mock-queries";
import { suggestedPrompts } from "@/data/suggested-prompts";

const API_KEY  = (import.meta.env.VITE_API_KEY  as string) ?? "";
const API_URL  = (import.meta.env.VITE_API_BASE_URL as string) ?? "";
const USE_REAL = API_KEY !== "" && API_URL !== "";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  };
}

// ── DB 스키마 ─────────────────────────────────────────────────────────
// 실제 API: GET /schema  →  Table[]
export async function fetchSchema(): Promise<Table[]> {
  if (!USE_REAL) return mockSchema;
  const res = await fetch(`${API_URL}/schema`, { headers: authHeaders() });
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
