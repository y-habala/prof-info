import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAM_SESSION_COOKIE, verifyExamSession } from "@/lib/auth/exam-session";
import { ExamRunner } from "@/components/exams/exam-runner";
import { shuffleSeeded } from "@/lib/shuffle";

export default async function ExamAttemptPage({
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
    .select("id, exam_id, started_at, submitted_at, exams(id, title, description, duration_minutes)")
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt || attempt.exam_id !== session.examId) {
    notFound();
  }

  if (attempt.submitted_at) {
    redirect(`/exam/${attemptId}/resultat`);
  }

  const exam = attempt.exams as unknown as {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
  };

  // exam_questions/exam_options carry correct answers and have zero anon RLS
  // access — service role bypasses that deliberately here, and is_correct is
  // stripped below before anything reaches the client.
  const [{ data: sectionsData }, { data: questions }] = await Promise.all([
    admin
      .from("exam_sections")
      .select("id, title, image_url, order_index")
      .eq("exam_id", exam.id)
      .order("order_index"),
    admin
      .from("exam_questions")
      .select(
        "id, section_id, question_text, question_type, points, order_index, exam_options(id, option_text, order_index)"
      )
      .eq("exam_id", exam.id)
      .order("order_index"),
  ]);

  const scrubbedQuestions = (questions ?? []).map((q) => ({
    id: q.id,
    sectionId: q.section_id,
    questionText: q.question_text,
    questionType: q.question_type,
    points: q.points,
    options: (q.exam_options ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((o) => ({ id: o.id, text: o.option_text })),
  }));

  // Section order stays fixed (deliberate pedagogical structure), but the
  // questions within each section are shuffled independently per attempt —
  // a compound seed (not the bare attemptId reused everywhere) so two
  // same-length sections don't end up with the identical permutation.
  const sections = [
    ...(sectionsData ?? []).map((s) => ({
      id: s.id as string | null,
      title: s.title as string | null,
      imageUrl: s.image_url,
    })),
    { id: null, title: null, imageUrl: null },
  ].map((s) => ({
    ...s,
    questions: shuffleSeeded(
      scrubbedQuestions.filter((q) => q.sectionId === s.id),
      `${attemptId}:${s.id ?? "none"}`
    ),
  }));

  const deadline = new Date(attempt.started_at).getTime() + exam.duration_minutes * 60_000;

  return (
    <ExamRunner
      attemptId={attempt.id}
      examTitle={exam.title}
      examDescription={exam.description}
      deadline={deadline}
      sections={sections}
    />
  );
}
