import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamVerifyForm } from "@/components/exams/exam-verify-form";

export const metadata: Metadata = {
  title: "Examen — Plateforme Informatique",
};

export default function ExamEntryPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Accès à l&apos;examen</CardTitle>
          <p className="text-sm text-muted-foreground">
            Entrez le code communiqué par votre enseignant ainsi que vos informations.
          </p>
        </CardHeader>
        <CardContent>
          <ExamVerifyForm />
        </CardContent>
      </Card>
    </div>
  );
}
