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
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Résultat — {exam.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {attempt.score} / {attempt.max_score}
          </p>
          <p className="text-muted-foreground">{attempt.percentage} %</p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
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
