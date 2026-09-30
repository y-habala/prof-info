"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExamVerifyForm() {
  const router = useRouter();
  const [secretCode, setSecretCode] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(secretCode)) {
      setError("Le code doit contenir exactement 4 chiffres.");
      return;
    }
    if (!studentName.trim() || !studentFirstName.trim()) {
      setError("Nom et prénom sont requis.");
      return;
    }
    if (!classNumber || Number(classNumber) < 1) {
      setError("Le numéro de classe est requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/exam/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretCode,
          studentName,
          studentFirstName,
          classNumber: Number(classNumber),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="secretCode">Code de l&apos;examen (4 chiffres)</Label>
        <Input
          id="secretCode"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="• • • •"
          className="h-14 text-center text-2xl tracking-[0.4em]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="studentFirstName">Prénom</Label>
        <Input
          id="studentFirstName"
          value={studentFirstName}
          onChange={(e) => setStudentFirstName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="studentName">Nom</Label>
        <Input id="studentName" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="classNumber">Numéro de classe</Label>
        <Input
          id="classNumber"
          value={classNumber}
          onChange={(e) => setClassNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="ex. 3"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Vérification..." : "Commencer l'examen"}
      </Button>
    </form>
  );
}
