"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Open-redirect guard: only honor same-origin, path-only redirects. A query
// param like ?redirect=//evil.com would otherwise send the student off-site.
function safeRedirect(target: string | undefined): string {
  if (!target) return "/";
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

export function AccessForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(code)) {
      setError("Le code doit contenir 4 chiffres.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Une erreur est survenue.");
        return;
      }
      router.push(safeRedirect(redirectTo));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      <div className="space-y-2">
        <label htmlFor="code" className="text-sm font-medium">
          Code d&apos;accès
        </label>
        <input
          id="code"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          placeholder="• • • •"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="h-16 w-full rounded-xl border border-input bg-background text-center text-3xl tracking-[0.75em] font-mono shadow-sm focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Vérification…
          </>
        ) : (
          <>
            Accéder
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
