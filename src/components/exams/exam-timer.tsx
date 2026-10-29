"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const RING = 15; // radius of the countdown ring, in a 36×36 box
const CIRC = 2 * Math.PI * RING;

export function ExamTimer({
  deadline,
  totalSeconds,
  onExpire,
}: {
  deadline: number;
  /** Full exam duration, so the ring can show how much time is left. */
  totalSeconds: number;
  onExpire: () => void;
}) {
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

  const r = remaining ?? totalSeconds;
  const m = Math.floor(r / 60);
  const s = r % 60;
  const low = remaining !== null && r <= 60;
  const warn = remaining !== null && r <= 5 * 60;
  const fraction = totalSeconds > 0 ? Math.min(1, r / totalSeconds) : 1;

  return (
    <div
      role="timer"
      aria-label="Temps restant"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border pl-1 pr-3 shadow-sm transition-colors",
        low
          ? "border-rose-600 bg-rose-600 text-white"
          : warn
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-white text-slate-900"
      )}
    >
      <span className={cn("relative flex size-8 items-center justify-center", low && "animate-pulse")}>
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r={RING}
            fill="none"
            strokeWidth="3"
            className={low ? "stroke-white/30" : warn ? "stroke-rose-100" : "stroke-slate-100"}
          />
          <circle
            cx="18"
            cy="18"
            r={RING}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fraction)}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-linear",
              low ? "stroke-white" : warn ? "stroke-rose-500" : "stroke-primary"
            )}
          />
        </svg>
        <Timer
          className={cn("size-4", low ? "text-white" : warn ? "text-rose-500" : "text-primary")}
          strokeWidth={2.5}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "hidden text-[10px] font-semibold uppercase tracking-wider sm:block",
            low ? "text-white/80" : warn ? "text-rose-500" : "text-slate-500"
          )}
        >
          Temps restant
        </span>
        <span className="font-mono text-lg font-bold tabular-nums sm:mt-0.5">
          {remaining === null ? "--:--" : `${m}:${String(s).padStart(2, "0")}`}
        </span>
      </span>
    </div>
  );
}
