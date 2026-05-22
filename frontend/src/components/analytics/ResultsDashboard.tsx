import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  LineChart,
  PieChart,
  Search,
  ScatterChart,
  ImageDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlotlyChart } from "./PlotlyChart";
import { fetchKpis } from "@/lib/api";
import type { Kpi, QueryResult } from "@/lib/types";

type ChartType = QueryResult["chart"]["type"];
const chartIcon: Record<ChartType, typeof BarChart3> = {
  bar: BarChart3, line: LineChart, pie: PieChart, scatter: ScatterChart,
};
const chartLabel: Record<ChartType, string> = {
  bar: "막대", line: "선형", pie: "원형", scatter: "산점도",
};

function AnimatedNumber({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const display = value >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(1);
  return (
    <span className="tabular-nums">
      {prefix}{display}{suffix}
    </span>
  );
}

function KpiCard({ k }: { k: Kpi }) {
  const up = k.trend === "up";
  return (
    <div className="glass rounded-xl p-4 relative overflow-hidden group hover:border-primary/30 transition-all">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ background: "var(--gradient-glow)" }} />
      <div className="relative">
        <div className="text-[11px] text-muted-foreground">{k.label}</div>
        <div className="text-2xl font-semibold mt-1.5 gradient-text">
          <AnimatedNumber value={k.value} prefix={k.prefix} suffix={k.suffix} />
        </div>
        <div className={`mt-2 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md ${
          up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
        }`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(k.change)}% 전월 대비
        </div>
      </div>
    </div>
  );
}

export function ResultsDashboard({ result }: { result: QueryResult }) {
  const allowedCharts: ChartType[] = ["bar", "line", "pie", "scatter"];
  const [chart, setChart] = useState<ChartType>(result.chart.type);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const pageSize = 6;

  useEffect(() => {
    fetchKpis().then(setKpis);
  }, []);

  useEffect(() => {
    setChart(result.chart.type);
    setPage(0);
    setQuery("");
  }, [result]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return result.rows;
    return result.rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [query, result]);
  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  function downloadCsv() {
    const headers = result.columns.map((c) => c.key);
    const lines = [
      result.columns.map((c) => c.label).join(","),
      ...result.rows.map((r) => headers.map((h) => r[h]).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_result.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartData = useMemo(() => {
    const { x, y, name } = result.chart;
    const color = "rgba(56, 100, 220, 1)";
    const fill  = "rgba(56, 100, 220, 0.14)";
    if (chart === "pie") {
      return [{
        type: "pie" as const,
        labels: x,
        values: y,
        hole: 0.55,
        marker: { colors: x.map((_, i) => `hsl(${210 + i * 18}, 70%, ${55 + (i % 3) * 6}%)`) },
        textinfo: "label+percent" as const,
      }];
    }
    if (chart === "scatter") {
      return [{
        type: "scatter" as const,
        mode: "markers+text" as const,
        x, y,
        text: result.rows.map((r) => String(Object.values(r)[0])),
        textposition: "top center" as const,
        marker: { size: 14, color, line: { color: "rgba(255,255,255,0.6)", width: 1 } },
        name: name ?? "값",
      }];
    }
    if (chart === "bar") {
      return [{ type: "bar" as const, x, y, name: name ?? "값", marker: { color } }];
    }
    return [{
      type: "scatter" as const,
      mode: "lines+markers" as const,
      x, y,
      line: { color, width: 2.5, shape: "spline" as const },
      marker: { size: 7, color },
      fill: "tozeroy" as const,
      fillcolor: fill,
      name: name ?? "값",
    }];
  }, [chart, result]);

  return (
    <div className="h-full flex flex-col overflow-y-auto scrollbar-thin">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">{result.intent}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              가상 SQL 엔진 · {result.rows.length}개 행 반환 · 패션 이커머스 DB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadCsv}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" variant="outline">
              <ImageDown className="h-3.5 w-3.5" /> 차트 내보내기
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.length === 0
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-shimmer" />
              ))
            : kpis.map((k) => <KpiCard key={k.label} k={k} />)
          }
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">{result.chart.title}</div>
              <div className="text-[11px] text-muted-foreground">차트 유형을 전환해 같은 데이터를 다양하게 탐색하세요</div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-surface/60 border border-border/50">
              {allowedCharts.map((c) => {
                const Icon = chartIcon[c];
                return (
                  <button
                    key={c}
                    onClick={() => setChart(c)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                      chart === c
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {chartLabel[c]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-[320px] animate-fade-in" key={`${result.intent}-${chart}`}>
            <PlotlyChart data={chartData as never} />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">결과 데이터 · {filtered.length}개 행</div>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder="행 필터링…"
                className="pl-8 h-8 text-xs bg-input/60"
              />
            </div>
          </div>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-surface/60">
                <tr>
                  {result.columns.map((h) => (
                    <th key={h.key} className="text-left font-medium text-muted-foreground px-3 py-2 uppercase text-[10px] tracking-wider">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i} className="border-t border-border/40 hover:bg-accent/30">
                    {result.columns.map((c) => {
                      const v = r[c.key];
                      const isNum = typeof v === "number";
                      return (
                        <td key={c.key} className={`px-3 py-2 ${isNum ? "tabular-nums" : ""}`}>
                          {isNum ? v.toLocaleString() : String(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={result.columns.length} className="text-center py-8 text-muted-foreground">
                      필터와 일치하는 행이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
            <span>{totalPages}페이지 중 {page + 1}페이지</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
