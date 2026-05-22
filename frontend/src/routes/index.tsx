import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart2, PanelLeft, Sparkles } from "lucide-react";
import { SchemaSidebar } from "@/components/analytics/SchemaSidebar";
import { ChatWorkspace } from "@/components/analytics/ChatWorkspace";
import { SqlDebugPanel } from "@/components/analytics/SqlDebugPanel";
import { ResultsDashboard } from "@/components/analytics/ResultsDashboard";
import { ResizableSplit } from "@/components/analytics/ResizableSplit";
import { Button } from "@/components/ui/button";
import type { QueryResult } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Analytics — 패션 이커머스 AI 분석" },
      {
        name: "description",
        content:
          "패션 이커머스 가상 DB를 자연어로 질의하고, SQL · 결과 표 · 인터랙티브 차트를 즉시 확인할 수 있는 셀프서비스 분석 워크스페이스.",
      },
      { property: "og:title", content: "Lumen Analytics — 패션 이커머스 AI 분석" },
      {
        property: "og:description",
        content: "데이터와 대화하세요. SQL을 생성하고, 몇 초 만에 인사이트를 얻으세요.",
      },
    ],
  }),
  component: Workspace,
});

function EmptyDashboard() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground select-none">
      <div
        className="h-14 w-14 rounded-2xl grid place-items-center opacity-20"
        style={{ background: "var(--gradient-primary)" }}
      >
        <BarChart2 className="h-7 w-7 text-primary-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground/40">아직 분석 결과가 없습니다</p>
        <p className="text-xs text-muted-foreground/60">왼쪽 채팅창에 질문을 입력하면<br />차트와 데이터가 여기에 표시됩니다</p>
      </div>
    </div>
  );
}

function Workspace() {
  const [sidebar, setSidebar] = useState(true);
  const [runKey, setRunKey] = useState(0);
  const [result, setResult] = useState<QueryResult | null>(null);

  const handleResult = (r: QueryResult) => {
    setResult(r);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-foreground">
      <header className="h-12 shrink-0 glass-strong flex items-center px-3 gap-3 border-b border-border/40 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebar((s) => !s)}>
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold gradient-text">Lumen Analytics</div>
            <div className="text-[10px] text-muted-foreground">패션 이커머스 · fashion_commerce</div>
          </div>
        </div>
        <div className="mx-3 h-5 w-px bg-border/60" />
        <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
          가상 DB 연결됨 · 실시간 동기화
        </div>
        <div className="ml-auto flex items-center gap-2">
          <kbd className="hidden md:inline-flex text-[10px] px-1.5 py-0.5 rounded border border-border/60 bg-surface/60 text-muted-foreground">
            ⌘ K
          </kbd>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 border border-border/60" />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {sidebar && (
          <div className="w-72 shrink-0 border-r border-border/40 animate-fade-in">
            <SchemaSidebar />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <ResizableSplit direction="horizontal" initial={0.36} min={0.22} max={0.55}>
            <div className="h-full border-r border-border/40">
              <ChatWorkspace onResult={handleResult} />
            </div>

            <ResizableSplit direction="vertical" initial={0.62} min={0.3} max={0.85}>
              <div className="h-full">
                {result ? <ResultsDashboard result={result} /> : <EmptyDashboard />}
              </div>
              <div className="h-full border-t border-border/40">
                {result && <SqlDebugPanel runKey={runKey} result={result} />}
              </div>
            </ResizableSplit>
          </ResizableSplit>
        </div>
      </div>
    </div>
  );
}
