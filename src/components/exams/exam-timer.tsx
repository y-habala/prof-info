"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExamTimer({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  // Start at null (identical server/client first render) and let the first
  // interval tick fill in the real value — avoids a hydration mismatch when
  // this component is streamed from a server render.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const r = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) onExpire();
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (remaining === null) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 font-mono text-sm font-semibold text-slate-700">
        <Clock className="size-3.5" />
        --:--
      </div>
    );
  }

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const low = remaining <= 60;
  const warn = remaining <= 5 * 60;
  return (
    <div
      role="timer"
      aria-label="Temps restant"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 font-mono text-sm font-semibold transition-colors",
        low
          ? "border-rose-600 bg-rose-600 text-white"
          : warn
            ? "border-amber-300 bg-amber-50 text-amber-800"
            : "border-slate-300 text-slate-700"
      )}
    >
      <Clock className="size-3.5" />
      {m}:{String(s).padStart(2, "0")}
    </div>
  );
}
