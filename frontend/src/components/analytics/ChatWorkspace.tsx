import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzePrompt, suggestedPrompts, type QueryResult } from "@/lib/api";

// api.ts와 동일한 조건: URL만 있으면 실서버 모드
const USE_REAL = !!(import.meta.env.VITE_API_BASE_URL as string);

type Msg = { role: "user" | "assistant"; content: string; thinking?: boolean };

export function ChatWorkspace({ onResult }: { onResult?: (r: QueryResult) => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const v = text.trim();
    if (!v) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMessages((m) => [
      ...m,
      { role: "user", content: v },
      { role: "assistant", content: "", thinking: true },
    ]);
    setInput("");

    analyzePrompt(v, abortRef.current.signal)
      .then((result) => {
        // chart가 없는 경우(일반 대화, 추가질문 요청 등)는 대시보드를 갱신하지 않고
        // 챗 말풍선에만 insight 메시지를 표시한다.
        if (result.chart) onResult?.(result);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: result.insight };
          return copy;
        });
      })
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `오류가 발생했습니다: ${(err as Error)?.message ?? String(err)}`,
          };
          return copy;
        });
      });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2 glass">
        <div
          className="h-7 w-7 rounded-md grid place-items-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">분석 코파일럿</div>
          <div className="text-[10px] text-muted-foreground truncate max-w-[260px]">
            fashion-analyst ·{" "}
            {USE_REAL
              ? (import.meta.env.VITE_API_BASE_URL as string)
              : "목업 모드 (VITE_API_KEY / VITE_API_BASE_URL 미설정)"}
          </div>
        </div>
        <span
          className={`text-[10px] px-2 py-1 rounded-md border ${
            USE_REAL
              ? "bg-success/15 text-success border-success/30"
              : "bg-warning/15 text-warning border-warning/30"
          }`}
        >
          {USE_REAL ? "API 연결됨" : "목업 모드"}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className="flex gap-3 animate-slide-up">
            <div
              className={`h-7 w-7 shrink-0 rounded-md grid place-items-center border ${
                m.role === "user" ? "bg-accent/60 border-border" : "border-primary/30"
              }`}
              style={m.role === "assistant" ? { background: "var(--gradient-primary)" } : undefined}
            >
              {m.role === "user" ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted-foreground mb-1">
                {m.role === "user" ? "사용자" : "코파일럿"}
              </div>
              {m.thinking ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <span className="ml-2">스키마 분석 및 SQL 생성 중…</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-sm text-foreground/90 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      code: ({ children, className }) => {
                        const isBlock = (className || "").includes("language-");
                        if (isBlock) {
                          return (
                            <pre className="bg-surface-elevated border border-border/60 rounded-lg p-3 overflow-x-auto scrollbar-thin">
                              <code className="text-xs font-mono text-foreground/90">
                                {children}
                              </code>
                            </pre>
                          );
                        }
                        return (
                          <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-[12px]">
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-foreground font-semibold">{children}</strong>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 pt-2">
        <div className="flex gap-2 flex-wrap mb-3">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-[11px] px-2.5 py-1.5 rounded-full glass hover:border-primary/40 hover:text-primary transition-all"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="glass-strong rounded-2xl p-2 flex items-end gap-2 focus-within:glow-ring transition-shadow">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="이커머스 데이터에 대해 무엇이든 물어보세요…"
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent text-sm focus-visible:ring-0 min-h-[36px] max-h-32 py-2"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="h-8 w-8 shrink-0 rounded-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-2">
          코파일럿은 실수할 수 있습니다. 운영 환경에서 실행하기 전에 쿼리를 확인하세요.
        </div>
      </div>
    </div>
  );
}
