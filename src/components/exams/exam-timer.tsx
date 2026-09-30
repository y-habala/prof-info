"use client";

import { useEffect, useRef, useState } from "react";

// Display-only — the server independently recomputes and enforces the
// deadline on submit (started_at + duration_minutes), never trusting this
// client clock. onExpire just triggers the same submit the student could
// click themselves; a clock-skewed or paused tab can't extend the window.
export function ExamTimer({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  // Starts `null` rather than `deadline - Date.now()`: that call reads a
  // different instant during SSR than during client hydration a moment
  // later, so the very first render would mismatch (React warns and
  // discards the SSR tree). The interval below fills in the real value on
  // its first tick — a "--:--" placeholder for up to one second is a fine
  // trade for never mismatching.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const hasExpired = useRef(false);
  // Ref instead of an effect dependency: ExamRunner passes a new onExpire
  // closure (over `answers`) on every keystroke, and re-running this effect
  // each time would keep resetting the interval before it ever ticks.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const next = deadline - Date.now();
      setRemainingMs(next);
      if (next <= 0 && !hasExpired.current) {
        hasExpired.current = true;
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (remainingMs === null) {
    return (
      <div className="rounded-full bg-primary-foreground/20 px-4 py-1.5 text-center font-mono text-sm font-medium">
        --:--
      </div>
    );
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds <= 60;

  return (
    <div
      className={`rounded-full px-4 py-1.5 text-center font-mono text-sm font-medium ${
        isLow ? "bg-destructive text-destructive-foreground" : "bg-primary-foreground/20"
      }`}
    >
      {minutes}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
