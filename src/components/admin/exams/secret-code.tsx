"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Exam code hidden by default; the eye button reveals it. */
export function SecretCode({ code, className }: { code: string; className?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("font-mono font-bold tracking-widest", className)}>{shown ? code : "••••"}</span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Masquer le code" : "Afficher le code"}
        title={shown ? "Masquer le code" : "Afficher le code"}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </span>
  );
}
