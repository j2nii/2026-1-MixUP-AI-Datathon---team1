import { useEffect, useState } from "react";
import { Check, CircleDashed, Loader2, Sparkles, Terminal, Zap } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { QueryResult } from "@/lib/types";

type Step = { label: string; status: "pending" | "running" | "done"; detail?: string };

function buildSteps(result: QueryResult): Step[] {
  return [
    { label: "자연어 파싱", status: "done", detail: `의도: ${result.intent}` },
    {
      label: "스키마 참조 해석",
      status: "done",
      detail: "users, products, orders, order_items, reviews, coupons",
    },
    { label: "SQL 플랜 생성", status: "done", detail: "JOIN / GROUP BY 감지됨" },
    { label: "카탈로그 검증", status: "done", detail: "✓ 모든 컬럼 존재함" },
    { label: "쿼리 최적화", status: "done", detail: "인덱스 힌트 적용" },
    { label: "가상 엔진 실행", status: "done", detail: `${result.rows.length}행 반환 · 28ms` },
  ];
}

const statusLabels: Record<string, string> = {
  validating: "검증 중",
  optimized: "최적화됨",
  executed: "실행 완료",
  failed: "실패",
};

const statusStyles: Record<string, string> = {
  validating: "bg-warning/15 text-warning border-warning/30",
  optimized: "bg-info/15 text-info border-info/30",
  executed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

export function SqlDebugPanel({ runKey = 0, result }: { runKey?: number; result: QueryResult }) {
  const finalSteps = buildSteps(result);
  const [steps, setSteps] = useState<Step[]>(finalSteps);
  const [status, setStatus] = useState<"validating" | "optimized" | "executed">("executed");
  const [elapsed, setElapsed] = useState(186);

  useEffect(() => {
    setSteps(buildSteps(result));
  }, [result]);

  useEffect(() => {
    if (runKey === 0) return;
    const target = buildSteps(result);
    setStatus("validating");
    setSteps(target.map((s) => ({ ...s, status: "pending" })));
    let i = 0;
    const interval = setInterval(() => {
      setSteps((prev) => {
        const copy = [...prev];
        if (i < copy.length) copy[i] = { ...copy[i], status: "running" };
        if (i - 1 >= 0) copy[i - 1] = { ...copy[i - 1], status: "done" };
        return copy;
      });
      i++;
      if (i === 3) setStatus("optimized");
      if (i > target.length) {
        clearInterval(interval);
        setStatus("executed");
        setSteps(target);
        setElapsed(40 + Math.round(Math.random() * 80));
      }
    }, 240);
    return () => clearInterval(interval);
  }, [runKey, result]);

  return (
    <div className="h-full flex flex-col glass-strong">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <Terminal className="h-3.5 w-3.5 text-primary" />
        <div className="text-sm font-semibold">SQL 디버그</div>
        <span
          className={`ml-auto text-[10px] px-2 py-0.5 rounded-md border ${statusStyles[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>

      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-warning" /> {elapsed}ms
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" /> {result.rows.length}행 반환됨
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            생성된 쿼리
          </div>
          <div className="rounded-lg border border-border/60 overflow-hidden text-xs">
            <SyntaxHighlighter
              language="sql"
              style={oneLight as never}
              customStyle={{
                margin: 0,
                padding: "12px",
                background: "oklch(0.975 0.005 250)",
                fontSize: "11px",
                lineHeight: "1.55",
              }}
              wrapLongLines
            >
              {result.sql}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            실행 추적
          </div>
          <div className="space-y-1.5">
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-xs p-2 rounded-md hover:bg-accent/30 transition-colors"
              >
                <div className="mt-0.5">
                  {s.status === "done" ? (
                    <div className="h-4 w-4 rounded-full bg-success/20 border border-success/40 grid place-items-center">
                      <Check className="h-2.5 w-2.5 text-success" />
                    </div>
                  ) : s.status === "running" ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground/90">{s.label}</div>
                  {s.detail && (
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {s.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
