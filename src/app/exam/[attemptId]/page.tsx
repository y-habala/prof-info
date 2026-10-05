import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { shuffleSeeded } from "@/lib/shuffle";
import { ExamRunner, type SectionGroup } from "@/components/exams/exam-runner";
import type { ExamQuestionType } from "@/schemas/exams";

export default async function ExamTakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const jar = await cookies();
  const session = await verifyExamSession(jar.get(EXAM_SESSION_COOKIE)?.value);
  if (!session || session.attemptId !== attemptId) redirect("/exam");

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, exam_model_id, started_at, submitted_at, exam_models(exam_id, label, exams(title, duration_minutes))")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.exam_model_id !== session.modelId) notFound();

  // If already submitted, go to the resultat page.
  if (attempt.submitted_at) redirect(`/exam/${attemptId}/resultat`);

  const modelRow = attempt.exam_models as unknown as {
    exam_id: string;
    label: string;
    exams: { title: string; duration_minutes: number } | null;
  } | null;
  if (!modelRow || !modelRow.exams) notFound();

  const examTitle = modelRow.exams.title;
  const durationMinutes = modelRow.exams.duration_minutes;
  const deadline = new Date(attempt.started_at).getTime() + durationMinutes * 60 * 1000;

  // Fetch structure for this specific model
  const [{ data: sectionsRaw }, { data: questionsRaw }, { data: optionsRaw }] = await Promise.all([
    admin
      .from("exam_sections")
      .select("id, title, image_url, order_index")
      .eq("exam_model_id", session.modelId)
      .order("order_index"),
    admin
      .from("exam_questions")
      .select("id, section_id, question_text, question_type, points, order_index")
      .eq("exam_model_id", session.modelId)
      .order("order_index"),
    admin
      .from("exam_options")
      .select("id, question_id, option_text, order_index")
      .in(
        "question_id",
        (await admin.from("exam_questions").select("id").eq("exam_model_id", session.modelId)).data?.map((q) => q.id) ??
          ["00000000-0000-0000-0000-000000000000"]
      ),
  ]);

  // Build sections list (plus a synthetic section for section_id=null)
  const optionsByQuestion = new Map<string, { id: string; text: string }[]>();
  for (const o of optionsRaw ?? []) {
    const arr = optionsByQuestion.get(o.question_id) ?? [];
    arr.push({ id: o.id, text: o.option_text });
    optionsByQuestion.set(o.question_id, arr);
  }
  for (const [, arr] of optionsByQuestion) arr.sort((a, b) => a.text.localeCompare(b.text, "fr"));

  function buildQuestions(sectionId: string | null) {
    const list = (questionsRaw ?? [])
      .filter((q) => q.section_id === sectionId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((q) => ({
        id: q.id,
        text: q.question_text,
        type: q.question_type as ExamQuestionType,
        points: Number(q.points),
        options: optionsByQuestion.get(q.id) ?? [],
      }));
    // Per-attempt shuffle, seeded by attemptId + sectionId so two sections
    // of the same length don't share a permutation.
    const seed = `${attemptId}:${sectionId ?? "none"}`;
    return shuffleSeeded(list, seed);
  }

  const sections: SectionGroup[] = [
    ...(sectionsRaw ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      imageUrl: s.image_url,
      questions: buildQuestions(s.id),
    })),
    { id: null, title: null, imageUrl: null, questions: buildQuestions(null) },
  ].filter((s) => s.questions.length > 0);

  return (
    <ExamRunner
      attemptId={attemptId}
      examTitle={examTitle}
      modelLabel={modelRow.label}
      deadline={deadline}
      sections={sections}
    />
  );
}
