import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="student-theme flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md rounded-2xl border-border text-center shadow-lg">
        <CardHeader className="items-center pt-8">
          <CardTitle className="text-lg font-bold text-muted-foreground">{exam.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-8">
          <div className="mx-auto flex size-28 flex-col items-center justify-center rounded-full border-4 border-gold bg-primary text-primary-foreground">
            <span className="text-3xl font-extrabold leading-none">
              {attempt.score}
              <span className="text-lg font-medium text-primary-foreground/70">/{attempt.max_score}</span>
            </span>
            <span className="mt-1 text-xs font-medium text-primary-foreground/80">{attempt.percentage} %</span>
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
