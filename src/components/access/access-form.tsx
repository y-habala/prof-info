"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Only a same-origin relative path is honored — never redirect off-site
// based on a query param an attacker could craft into a shared link.
function safeRedirectTarget(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) {
      setError("Le code doit contenir exactement 4 chiffres.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Une erreur est survenue.");
        return;
      }
      router.push(safeRedirectTarget(searchParams.get("redirect")));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        autoFocus
        placeholder="• • • •"
        aria-label="Code d'accès"
        className="h-16 text-center text-3xl tracking-[0.5em]"
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending || code.length !== 4}>
        {isPending ? "Vérification..." : "Accéder"}
      </Button>
    </form>
  );
}
