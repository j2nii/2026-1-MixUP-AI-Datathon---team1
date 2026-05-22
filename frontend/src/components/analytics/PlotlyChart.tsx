import { useEffect, useRef, useState } from "react";
import type { Data, Layout } from "plotly.js";

export function PlotlyChart({ data, layout }: { data: Data[]; layout?: Partial<Layout> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const plotlyRef = useRef<typeof import("plotly.js-dist-min") | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Dynamic import keeps Plotly off the SSR path entirely.
    import("plotly.js-dist-min").then((mod) => {
      if (cancelled) return;
      plotlyRef.current = mod;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !ref.current || !plotlyRef.current) return;
    const Plotly = plotlyRef.current as never as {
      react: (el: HTMLDivElement, data: Data[], layout: Partial<Layout>, config: object) => void;
      purge: (el: HTMLDivElement) => void;
    };
    const baseLayout: Partial<Layout> = {
      autosize: true,
      margin: { l: 48, r: 16, t: 16, b: 40 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "inherit", color: "rgba(40, 50, 80, 0.75)", size: 11 },
      xaxis: { gridcolor: "rgba(0,0,0,0.06)", zerolinecolor: "rgba(0,0,0,0.08)" },
      yaxis: { gridcolor: "rgba(0,0,0,0.06)", zerolinecolor: "rgba(0,0,0,0.08)" },
      legend: { orientation: "h", y: -0.2 },
      transition: { duration: 400, easing: "cubic-in-out" },
      ...layout,
    };
    Plotly.react(ref.current, data, baseLayout, { displayModeBar: false, responsive: true });
  }, [ready, data, layout]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el && plotlyRef.current) {
        (plotlyRef.current as never as { purge: (e: HTMLDivElement) => void }).purge(el);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {!ready && <div className="absolute inset-0 animate-shimmer rounded-lg" />}
    </div>
  );
}
