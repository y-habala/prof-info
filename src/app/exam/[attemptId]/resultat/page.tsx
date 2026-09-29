import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const { data: questions } = await admin
    .from("exam_questions")
    .select("id, question_text, points, order_index, exam_options(option_text, is_correct)")
    .eq("exam_id", attempt.exam_id)
    .order("order_index");

  const { data: answers } = await admin
    .from("exam_answers")
    .select("question_id, is_correct, points_earned, answer_text")
    .eq("attempt_id", attemptId);

  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));

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
        </CardContent>
      </Card>
      {(questions ?? []).map((q, i) => {
        const a = answerByQuestion.get(q.id);
        if (!a || a.is_correct === null) return null;
        const correctTexts = (q.exam_options ?? []).filter((o) => o.is_correct).map((o) => o.option_text);
        return (
          <Card key={q.id}>
            <CardContent className="space-y-1 pt-4">
              <p className="text-sm font-medium">
                Q{i + 1}. {q.question_text}
              </p>
              <p className={a.is_correct ? "text-sm text-green-600" : "text-sm text-destructive"}>
                {a.is_correct ? "Correct" : "Incorrect"} — {a.points_earned}/{q.points} pt
              </p>
              {!a.is_correct && correctTexts.length > 0 ? (
                <p className="text-sm text-muted-foreground">Bonne réponse : {correctTexts.join(", ")}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
