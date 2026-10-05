import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scoreOutOf20, getAppreciation } from "@/lib/grading";

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const cookieStore = await cookies();
  const session = await verifyExamSession(cookieStore.get(EXAM_SESSION_COOKIE)?.value);
  if (!session || session.attemptId !== attemptId) {
    redirect("/exam");
  }

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, exam_id, score, max_score, percentage, submitted_at, exams(title)")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt || attempt.exam_id !== session.examId) {
    notFound();
  }
  if (!attempt.submitted_at) {
    redirect(`/exam/${attemptId}`);
  }

  const exam = attempt.exams as unknown as { title: string };
  const score20 = scoreOutOf20(Number(attempt.score), Number(attempt.max_score));
  const isPassing = score20 >= 10;
  const appreciation = getAppreciation(score20);
  const tierClass = isPassing ? "text-success" : "text-destructive";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card
        className={cn(
          "w-full max-w-md rounded-2xl border-2 text-center shadow-lg",
          isPassing ? "border-success" : "border-destructive"
        )}
      >
        <CardHeader className="items-center pt-8">
          <CardTitle className="text-sm font-medium text-muted-foreground">{exam.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-8">
          <div className="space-y-1">
            <p className={cn("text-lg font-bold", tierClass)}>Note Finale</p>
            <p className={cn("text-6xl leading-none font-extrabold", tierClass)}>
              {score20.toFixed(2)}
              <span className="text-2xl font-medium text-muted-foreground">/20</span>
            </p>
            <p className="text-muted-foreground">{appreciation}</p>
            <BookOpen className="mx-auto size-5 text-muted-foreground" />
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            nativeButton={false}
            render={<a href={`/api/exam/${attemptId}/pdf`} />}
          >
            Télécharger la feuille de réponses (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
