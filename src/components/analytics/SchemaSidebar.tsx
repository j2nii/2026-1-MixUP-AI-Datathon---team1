import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Database, Key, Link2, Search, Table as TableIcon } from "lucide-react";
import { fetchSchema } from "@/lib/api";
import type { Table } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
      {type}
    </span>
  );
}

function TableNode({ table, defaultOpen }: { table: Table; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg border border-border/40 bg-surface/40 hover:border-border transition-colors">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left group"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
        <TableIcon className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium text-foreground">{table.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
          {table.rowCount.toLocaleString()}
        </span>
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-0.5 animate-slide-up">
          {table.columns.map((col) => (
            <Tooltip key={col.name}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/40 cursor-default">
                  {col.isPrimary ? (
                    <Key className="h-3 w-3 text-warning" />
                  ) : col.isForeign ? (
                    <Link2 className="h-3 w-3 text-info" />
                  ) : (
                    <span className="h-3 w-3 inline-block" />
                  )}
                  <span className="text-xs font-mono text-foreground/90">{col.name}</span>
                  <span className="ml-auto">
                    <TypeBadge type={col.type} />
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-medium text-xs">{col.name}</div>
                  <div className="text-xs text-muted-foreground">{col.description}</div>
                  {col.references && (
                    <div className="text-[10px] font-mono text-info">→ {col.references}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaSidebar() {
  const [schema, setSchema] = useState<Table[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchSchema().then(setSchema);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return schema;
    return schema
      .map((t) => ({
        ...t,
        columns: t.columns.filter(
          (c) => c.name.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
        ),
      }))
      .filter((t) => t.name.toLowerCase().includes(q) || t.columns.length > 0);
  }, [query, schema]);

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="h-full flex flex-col glass-strong">
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Database className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">DB 딕셔너리</div>
              <div className="text-[10px] text-muted-foreground">
                fashion_commerce · {schema.length}개 테이블
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="테이블, 컬럼 검색…"
              className="pl-8 h-8 text-xs bg-input/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {schema.length === 0 && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-shimmer" />
              ))}
            </div>
          )}
          {filtered.map((t, i) => (
            <TableNode key={t.name} table={t} defaultOpen={i === 0 && !query} />
          ))}
          {schema.length > 0 && filtered.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8">일치하는 결과가 없습니다</div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border/40 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
          <span className="text-[10px] text-muted-foreground">연결됨 · 28ms</span>
        </div>
      </aside>
    </TooltipProvider>
  );
}
