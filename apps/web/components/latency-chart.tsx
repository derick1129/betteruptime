import type { WebsiteTick } from "@/lib/api";

export function LatencyChart({ ticks }: { ticks: WebsiteTick[] }) {
  if (!ticks || ticks.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground">
        No latency data recorded yet.
      </div>
    );
  }

  // Chronological order for chart
  const data = [...ticks].reverse();
  const maxMs = Math.max(...data.map((t) => t.response_time_ms), 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Latency timeline (ms)</span>
        <span>Max: {maxMs} ms</span>
      </div>
      <div className="h-44 w-full flex items-end gap-1.5 p-3 rounded-lg border border-border/60 bg-muted/10">
        {data.map((tick, idx) => {
          const heightPercent = Math.min(100, Math.max(12, (tick.response_time_ms / maxMs) * 100));
          const isDown = tick.status === "Down";

          return (
            <div
              key={tick.id || idx}
              className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-9 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground border border-border px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-md pointer-events-none">
                <span>{tick.response_time_ms} ms</span>
                <span className="text-muted-foreground">{tick.region?.name || "probe"}</span>
              </div>

              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-sm transition-all duration-300 ${
                  isDown
                    ? "bg-rose-500/80 hover:bg-rose-500"
                    : "bg-emerald-500/70 hover:bg-emerald-500"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
