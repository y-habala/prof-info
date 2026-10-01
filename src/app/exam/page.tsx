import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamVerifyForm } from "@/components/exams/exam-verify-form";

export const metadata: Metadata = {
  title: "Examen — Plateforme Informatique",
};

export default function ExamEntryPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-sm rounded-2xl border-border shadow-lg">
        <CardHeader className="items-center pt-8 text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-7" />
          </div>
          <CardTitle className="text-xl font-extrabold">Accès à l&apos;examen</CardTitle>
          <p className="text-sm text-muted-foreground">
            Entrez le code communiqué par votre enseignant ainsi que vos informations.
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <ExamVerifyForm />
        </CardContent>
      </Card>
    </div>
  );
}
