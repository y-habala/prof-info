import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreOutOf20, getAppreciation } from "@/lib/grading";
import { cn } from "@/lib/utils";

export default async function ExamResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const jar = await cookies();
  const session = await verifyExamSession(jar.get(EXAM_SESSION_COOKIE)?.value);
  if (!session || session.attemptId !== attemptId) redirect("/exam");

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, exam_model_id, score, max_score, submitted_at, exam_models(exams(title))")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.exam_model_id !== session.modelId) notFound();
  if (!attempt.submitted_at) redirect(`/exam/${attemptId}`);

  const examTitle = (attempt.exam_models as unknown as { exams: { title: string } | null } | null)?.exams?.title ?? "Examen";

  const score = Number(attempt.score ?? 0);
  const maxScore = Number(attempt.max_score ?? 0);
  const score20 = scoreOutOf20(score, maxScore);
  const isPassing = score20 >= 10;
  const appreciation = getAppreciation(score20);
  const tierColor = isPassing ? "text-success" : "text-destructive";
  const tierBorder = isPassing ? "border-success" : "border-destructive";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className={cn("w-full max-w-md border-2 text-center shadow-lg", tierBorder)}>
        <div className="space-y-5 p-8">
          <p className="text-sm font-medium text-muted-foreground">{examTitle}</p>
          <div className="space-y-1">
            <p className={cn("text-lg font-bold", tierColor)}>Note Finale</p>
            <p className={cn("text-6xl font-extrabold leading-none", tierColor)}>
              {score20.toFixed(2)}
              <span className="text-2xl font-medium text-muted-foreground">/20</span>
            </p>
            <p className="text-muted-foreground">{appreciation}</p>
            <BookOpen className="mx-auto size-5 text-muted-foreground" />
          </div>
          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="size-4" />
                Retour à l&apos;accueil
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
