// =====================================================================
// 하위 호환용 re-export
// 새 코드에서는 아래 경로를 직접 사용하세요:
//   타입       → @/lib/types
//   API 호출   → @/lib/api
//   목업 데이터 → @/data/*
// =====================================================================

export type { Column, Table, Kpi, QueryResult } from "./types";
export { mockSchema as schema } from "@/data/schema";
export { mockKpis as kpis } from "@/data/kpis";
export { suggestedPrompts } from "@/data/suggested-prompts";
export { runMockQuery as runQuery, mockDefaultQuery as defaultQuery } from "./mock-queries";
