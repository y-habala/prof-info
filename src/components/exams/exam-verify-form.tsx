"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExamVerifyForm() {
  const router = useRouter();
  const [secretCode, setSecretCode] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    if (!classNumber || Number(classNumber) < 1) {
      setError("Le numéro de classe est requis.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/exam/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretCode,
          studentFirstName,
          studentName,
          classNumber: Number(classNumber),
          studentNumber,
        }),
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
          onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
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
          <Label htmlFor="classNumber">N° de classe</Label>
          <Input
            id="classNumber"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="ex. 3"
            value={classNumber}
            onChange={(e) => setClassNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentNumber">N° (optionnel)</Label>
          <Input
            id="studentNumber"
            autoComplete="off"
            placeholder="ex. 12"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
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
