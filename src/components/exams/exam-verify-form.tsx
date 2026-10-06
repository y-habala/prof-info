"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExamVerifyForm({ classOptions }: { classOptions: string[] }) {
  const router = useRouter();
  const [secretCode, setSecretCode] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered class options based on the exam's level (resolved from secret code)
  const [resolvedLevel, setResolvedLevel] = useState<string | null>(null);

  const filteredOptions =
    resolvedLevel
      ? classOptions.filter((c) => c.startsWith(resolvedLevel + "-"))
      : classOptions;

  // Code typing — the reset lives here rather than in the effect below, because
  // a synchronous setState in an effect body causes a cascading render.
  function handleCodeChange(raw: string) {
    const next = raw.replace(/\D/g, "").slice(0, 4);
    setSecretCode(next);
    if (!/^\d{4}$/.test(next)) {
      setResolvedLevel(null);
      setStudentClass("");
    }
  }

  // When the code reaches 4 digits, quietly resolve the level
  useEffect(() => {
    if (!/^\d{4}$/.test(secretCode)) return;
    const ctrl = new AbortController();

    fetch("/api/exam/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretCode }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setResolvedLevel(data.levelName ?? null);
        setStudentClass("");
      })
      .catch(() => {});

    return () => ctrl.abort();
  }, [secretCode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(secretCode)) {
      setError("Le code doit contenir 4 chiffres.");
      return;
    }
    if (!studentFirstName.trim() || !studentName.trim()) {
      setError("Prénom et nom sont requis.");
      return;
    }
    if (!studentClass) {
      setError("Veuillez choisir votre classe.");
      return;
    }
    if (!studentNumber.trim()) {
      setError("Le numéro de l'élève est requis.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/exam/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretCode, studentFirstName, studentName, studentClass, studentNumber }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Une erreur est survenue.");
        return;
      }
      router.push(`/exam/${body.attemptId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="secretCode">Code de l&apos;examen</Label>
        <Input
          id="secretCode"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          placeholder="• • • •"
          value={secretCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="h-14 text-center text-2xl font-mono tracking-[0.5em]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="studentFirstName">Prénom</Label>
          <Input
            id="studentFirstName"
            autoComplete="off"
            value={studentFirstName}
            onChange={(e) => setStudentFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentName">Nom</Label>
          <Input
            id="studentName"
            autoComplete="off"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="studentClass">Classe</Label>
          {filteredOptions.length > 0 ? (
            <div className="relative">
              <select
                id="studentClass"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border border-input bg-background px-3 py-2.5 pr-9 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Choisir…</option>
                {filteredOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          ) : (
            <Input
              id="studentClass"
              autoComplete="off"
              placeholder="ex. 2APIC-3"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              required
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentNumber">N° de l&apos;élève</Label>
          <Input
            id="studentNumber"
            inputMode="numeric"
            autoComplete="off"
            placeholder="ex. 12"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            required
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Vérification…
          </>
        ) : (
          <>
            Commencer l&apos;examen
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
