import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: [ReactNode, ReactNode];
  direction?: "horizontal" | "vertical";
  initial?: number; // 0-1
  min?: number;
  max?: number;
  className?: string;
};

export function ResizableSplit({
  children,
  direction = "horizontal",
  initial = 0.5,
  min = 0.15,
  max = 0.85,
  className = "",
}: Props) {
  const [frac, setFrac] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const f =
        direction === "horizontal"
          ? (e.clientX - rect.left) / rect.width
          : (e.clientY - rect.top) / rect.height;
      setFrac(Math.max(min, Math.min(max, f)));
    },
    [direction, min, max],
  );

  const onUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onMove, onUp]);

  const isH = direction === "horizontal";
  const aSize = `${frac * 100}%`;
  const bSize = `${(1 - frac) * 100}%`;

  return (
    <div
      ref={ref}
      className={`flex ${isH ? "flex-row" : "flex-col"} h-full w-full ${className}`}
    >
      <div style={isH ? { width: aSize } : { height: aSize }} className="min-h-0 min-w-0 overflow-hidden">
        {children[0]}
      </div>
      <div
        onMouseDown={onDown}
        className={`group shrink-0 ${
          isH ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
        } bg-border/40 hover:bg-primary/40 transition-colors relative`}
      >
        <div className={`absolute ${isH ? "inset-y-0 -left-1 -right-1" : "inset-x-0 -top-1 -bottom-1"}`} />
      </div>
      <div style={isH ? { width: bSize } : { height: bSize }} className="min-h-0 min-w-0 overflow-hidden">
        {children[1]}
      </div>
    </div>
  );
}
