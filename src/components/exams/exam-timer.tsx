"use client";

import { useEffect, useRef, useState } from "react";

// Display-only — the server independently recomputes and enforces the
// deadline on submit (started_at + duration_minutes), never trusting this
// client clock. onExpire just triggers the same submit the student could
// click themselves; a clock-skewed or paused tab can't extend the window.
export function ExamTimer({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  const [remainingMs, setRemainingMs] = useState(() => deadline - Date.now());
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

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds <= 60;

  return (
    <div
      className={`rounded-md border px-3 py-2 text-center font-mono text-lg ${
        isLow ? "border-destructive text-destructive" : ""
      }`}
    >
      {minutes}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
