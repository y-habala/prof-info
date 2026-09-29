import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAM_SESSION_COOKIE, EXAM_GRACE_SECONDS, verifyExamSession } from "@/lib/auth/exam-session";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).optional(),
  text: z.string().optional(),
});

const submitSchema = z.object({
  answers: z.array(answerSchema),
});

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  const cookieStore = await cookies();
  const session = await verifyExamSession(cookieStore.get(EXAM_SESSION_COOKIE)?.value);
  if (!session || session.attemptId !== attemptId) {
    return NextResponse.json({ error: "Session d'examen invalide." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, exam_id, started_at, submitted_at, exams(duration_minutes)")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt || attempt.exam_id !== session.examId) {
    return NextResponse.json({ error: "Tentative introuvable." }, { status: 404 });
  }
  if (attempt.submitted_at) {
    return NextResponse.json({ error: "Cet examen a déjà été soumis." }, { status: 409 });
  }

  const exam = attempt.exams as unknown as { duration_minutes: number };
  // The server recomputes the deadline itself from durable data
  // (started_at + duration_minutes) — never trusts the client's own timer.
  // Same grace window as the cookie's expiry (see EXAM_GRACE_SECONDS).
  const deadline =
    new Date(attempt.started_at).getTime() + exam.duration_minutes * 60_000 + EXAM_GRACE_SECONDS * 1000;
  if (Date.now() > deadline) {
    return NextResponse.json({ error: "Le temps imparti est écoulé." }, { status: 403 });
  }

  const { data: questions } = await admin
    .from("exam_questions")
    .select("id, question_type, points, exam_options(id, option_text, is_correct)")
    .eq("exam_id", attempt.exam_id);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Examen sans questions." }, { status: 400 });
  }

  const answerByQuestion = new Map(parsed.data.answers.map((a) => [a.questionId, a]));

  let score = 0;
  let maxScore = 0;
  const results: {
    questionId: string;
    isCorrect: boolean | null;
    pointsEarned: number;
    answerText: string;
  }[] = [];

  for (const question of questions) {
    const submitted = answerByQuestion.get(question.id);
    const options = question.exam_options ?? [];
    const correctOptionIds = new Set(options.filter((o) => o.is_correct).map((o) => o.id));

    if (question.question_type === "open") {
      results.push({
        questionId: question.id,
        isCorrect: null,
        pointsEarned: 0,
        answerText: submitted?.text ?? "",
      });
      continue;
    }

    maxScore += question.points;
    let isCorrect = false;
    let answerText = "";

    if (question.question_type === "qcm_single" || question.question_type === "true_false") {
      const chosen = submitted?.optionIds?.[0];
      answerText = options.find((o) => o.id === chosen)?.option_text ?? "";
      isCorrect = !!chosen && correctOptionIds.has(chosen) && correctOptionIds.size === 1;
    } else if (question.question_type === "qcm_multiple") {
      const chosen = new Set(submitted?.optionIds ?? []);
      answerText = options
        .filter((o) => chosen.has(o.id))
        .map((o) => o.option_text)
        .join(", ");
      isCorrect =
        chosen.size === correctOptionIds.size && [...chosen].every((id) => correctOptionIds.has(id));
    } else if (question.question_type === "fill_blank") {
      answerText = submitted?.text?.trim() ?? "";
      const expected = options[0]?.option_text.trim().toLowerCase() ?? "";
      isCorrect = answerText.toLowerCase() === expected;
    }

    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;
    results.push({ questionId: question.id, isCorrect, pointsEarned, answerText });
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;

  const { error: updateError } = await admin
    .from("exam_attempts")
    .update({ score, max_score: maxScore, percentage, submitted_at: new Date().toISOString() })
    .eq("id", attemptId)
    .is("submitted_at", null); // guards a race against a second concurrent submit

  if (updateError) {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  await admin.from("exam_answers").insert(
    results.map((r) => ({
      attempt_id: attemptId,
      question_id: r.questionId,
      answer_text: r.answerText,
      is_correct: r.isCorrect,
      points_earned: r.pointsEarned,
    }))
  );

  return NextResponse.json({ attemptId, score, maxScore, percentage });
}
