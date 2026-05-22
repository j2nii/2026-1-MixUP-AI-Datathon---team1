export type Column = {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  description: string;
};

export type Table = {
  name: string;
  description: string;
  rowCount: number;
  columns: Column[];
};

export type Kpi = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  trend: "up" | "down";
};

export type QueryResult = {
  intent: string;
  sql: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
  chart: {
    type: "bar" | "line" | "pie" | "scatter";
    title: string;
    x: (string | number)[];
    y: (string | number)[];
    y2?: { name: string; values: (string | number)[] };
    name?: string;
  };
  insight: string;
};
