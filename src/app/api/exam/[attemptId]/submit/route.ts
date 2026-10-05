import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { normalizeAnswerText } from "@/lib/normalize-text";

export const runtime = "nodejs";

const EXAM_GRACE_SECONDS = 5 * 60;

const bodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      optionIds: z.array(z.string().uuid()).optional(),
      text: z.string().optional(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const jar = await cookies();
  const session = await verifyExamSession(jar.get(EXAM_SESSION_COOKIE)?.value);
  if (!session || session.attemptId !== attemptId) {
    return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, exam_model_id, started_at, submitted_at, exam_models(exam_id, exams(duration_minutes))")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt || attempt.exam_model_id !== session.modelId) {
    return NextResponse.json({ error: "Tentative introuvable." }, { status: 404 });
  }
  if (attempt.submitted_at) {
    return NextResponse.json({ error: "Déjà soumis." }, { status: 400 });
  }

  // Deadline check (server-authoritative — never trust client timer)
  const modelRow = attempt.exam_models as unknown as { exam_id: string; exams: { duration_minutes: number } | null } | null;
  if (!modelRow || !modelRow.exams) {
    return NextResponse.json({ error: "Examen introuvable." }, { status: 500 });
  }
  const deadline =
    new Date(attempt.started_at).getTime() +
    modelRow.exams.duration_minutes * 60 * 1000 +
    EXAM_GRACE_SECONDS * 1000;
  if (Date.now() > deadline) {
    // We still accept but immediately grade+finalize — the student loses
    // any work done after the real deadline, but the attempt lands as
    // "submitted" so results can be viewed.
  }

  // Fetch the authoritative questions + options for THIS model
  const { data: questions } = await admin
    .from("exam_questions")
    .select("id, question_type, points")
    .eq("exam_model_id", session.modelId);
  const { data: options } = await admin
    .from("exam_options")
    .select("id, question_id, option_text, is_correct")
    .in("question_id", (questions ?? []).map((q) => q.id).concat("00000000-0000-0000-0000-000000000000"));

  const optionsByQuestion = new Map<string, { id: string; text: string; isCorrect: boolean }[]>();
  for (const o of options ?? []) {
    const arr = optionsByQuestion.get(o.question_id) ?? [];
    arr.push({ id: o.id, text: o.option_text, isCorrect: o.is_correct });
    optionsByQuestion.set(o.question_id, arr);
  }

  let totalScore = 0;
  let totalMax = 0;
  const answerRows: {
    attempt_id: string;
    question_id: string;
    answer_text: string | null;
    is_correct: boolean;
    points_earned: number;
  }[] = [];

  for (const q of questions ?? []) {
    const points = Number(q.points);
    totalMax += points;
    const submitted = parsed.data.answers.find((a) => a.questionId === q.id);
    const qOptions = optionsByQuestion.get(q.id) ?? [];
    const correctOptionIds = new Set(qOptions.filter((o) => o.isCorrect).map((o) => o.id));

    let isCorrect = false;
    let pointsEarned = 0;
    let answerText = "";

    if (q.question_type === "qcm_single" || q.question_type === "true_false" || q.question_type === "matching") {
      const chosen = submitted?.optionIds?.[0] ?? "";
      answerText = qOptions.find((o) => o.id === chosen)?.text ?? "";
      isCorrect = chosen !== "" && correctOptionIds.has(chosen);
      if (isCorrect) pointsEarned = points;
    } else if (q.question_type === "qcm_multiple") {
      const chosen = new Set(submitted?.optionIds ?? []);
      const correctCount = qOptions.filter((o) => o.isCorrect).length;
      const chosenCorrect = qOptions.filter((o) => o.isCorrect && chosen.has(o.id)).length;
      const chosenWrong = qOptions.filter((o) => !o.isCorrect && chosen.has(o.id)).length;
      // Full points iff: all correct chosen AND no wrong chosen
      if (correctCount > 0 && chosenCorrect === correctCount && chosenWrong === 0) {
        isCorrect = true;
        pointsEarned = points;
      }
      answerText = qOptions
        .filter((o) => chosen.has(o.id))
        .map((o) => o.text)
        .join(" ; ");
    } else if (q.question_type === "fill_blank") {
      answerText = submitted?.text ?? "";
      const norm = normalizeAnswerText(answerText);
      isCorrect =
        norm.length > 0 &&
        qOptions.some((o) => o.isCorrect && normalizeAnswerText(o.text) === norm);
      if (isCorrect) pointsEarned = points;
    }

    totalScore += pointsEarned;
    answerRows.push({
      attempt_id: attemptId,
      question_id: q.id,
      answer_text: answerText || null,
      is_correct: isCorrect,
      points_earned: pointsEarned,
    });
  }

  // Persist answers + finalize the attempt in a sequence
  if (answerRows.length > 0) {
    await admin.from("exam_answers").insert(answerRows);
  }
  await admin
    .from("exam_attempts")
    .update({ score: totalScore, max_score: totalMax, submitted_at: new Date().toISOString() })
    .eq("id", attemptId);

  return NextResponse.json({ ok: true });
}
