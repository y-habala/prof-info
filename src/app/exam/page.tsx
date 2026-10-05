import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { ExamVerifyForm } from "@/components/exams/exam-verify-form";

export const metadata: Metadata = { title: "Examen — Plateforme Informatique" };

export default function ExamEntryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Shield className="size-6" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Accès à l&apos;examen</h1>
          <p className="text-sm text-muted-foreground">
            Saisis le code communiqué par ton enseignant et tes informations.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ExamVerifyForm />
        </div>
      </div>
    </main>
  );
}
