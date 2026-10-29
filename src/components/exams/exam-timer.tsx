"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
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
      <div className="inline-flex h-10 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 font-mono text-sm font-bold text-slate-800">
        <Timer className="size-[18px] text-slate-400" strokeWidth={2.25} />
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
        "inline-flex h-10 items-center gap-2 rounded-xl border-2 px-3 font-mono text-sm font-bold transition-colors",
        low
          ? "animate-pulse border-rose-600 bg-rose-600 text-white"
          : warn
            ? "border-orange-400 bg-orange-50 text-orange-800"
            : "border-slate-200 bg-white text-slate-800"
      )}
    >
      <Timer className={cn("size-[18px]", low ? "text-white" : warn ? "text-orange-500" : "text-slate-400")} strokeWidth={2.25} />
      {m}:{String(s).padStart(2, "0")}
    </div>
  );
}
