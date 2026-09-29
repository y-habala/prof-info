import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  // qcm_single/true_false: one option id. qcm_multiple: array of option ids.
  // fill_blank/open: free text.
  optionIds: z.array(z.string().uuid()).optional(),
  text: z.string().optional(),
});

const submitSchema = z.object({
  studentName: z.string().trim().min(1).max(100),
  studentFirstName: z.string().trim().min(1).max(100),
  studentClass: z.string().trim().max(100).optional().or(z.literal("")),
  answers: z.array(answerSchema),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: exerciseId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: exercise } = await admin
    .from("exercises")
    .select("id")
    .eq("id", exerciseId)
    .eq("is_published", true)
    .maybeSingle();

  if (!exercise) {
    return NextResponse.json({ error: "Exercice introuvable." }, { status: 404 });
  }

  const { data: questions } = await admin
    .from("exercise_questions")
    .select("id, question_type, points, exercise_options(id, option_text, is_correct)")
    .eq("exercise_id", exerciseId);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Exercice sans questions." }, { status: 400 });
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
    const options = question.exercise_options ?? [];
    const correctOptionIds = new Set(options.filter((o) => o.is_correct).map((o) => o.id));

    if (question.question_type === "open") {
      // Not auto-gradable — recorded but excluded from score and max_score.
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
        chosen.size === correctOptionIds.size &&
        [...chosen].every((id) => correctOptionIds.has(id));
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

  const { data: attempt, error: attemptError } = await admin
    .from("exercise_attempts")
    .insert({
      exercise_id: exerciseId,
      student_name: parsed.data.studentName,
      student_first_name: parsed.data.studentFirstName,
      student_class: parsed.data.studentClass || null,
      score,
      max_score: maxScore,
      percentage,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  await admin.from("exercise_answers").insert(
    results.map((r) => ({
      attempt_id: attempt.id,
      question_id: r.questionId,
      answer_text: r.answerText,
      is_correct: r.isCorrect,
      points_earned: r.pointsEarned,
    }))
  );

  const questionResults = questions.map((q) => {
    const r = results.find((res) => res.questionId === q.id)!;
    return {
      questionId: q.id,
      isCorrect: r.isCorrect,
      pointsEarned: r.pointsEarned,
      points: q.points,
      correctOptionTexts: (q.exercise_options ?? [])
        .filter((o) => o.is_correct)
        .map((o) => o.option_text),
    };
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    maxScore,
    percentage,
    questionResults,
  });
}
