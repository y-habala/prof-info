import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AnswerSheetDocument, type AnswerSheetData } from "@/lib/pdf/answer-sheet";

// @react-pdf/renderer needs Node APIs (Buffer, fs for fonts) — not available
// on the Edge runtime middleware/routes elsewhere in this app default to.
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  // Admin-only: the student's own exam-attempt session used to also work
  // here, but the answer sheet shows full correction (check/cross marks,
  // correct answers for wrong ones) — exactly what the exam résultat page
  // deliberately withholds from the student. Letting the student fetch this
  // route directly would have undermined that. The per-row "PDF" button in
  // ExamAttemptsTable (/admin/results/exams/[examId]) is this route's only
  // real caller now.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select(
      "student_name, student_first_name, student_number, student_class, score, max_score, percentage, submitted_at, exam_id, exams(title)"
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (!attempt || !attempt.submitted_at) {
    return new Response("Tentative introuvable.", { status: 404 });
  }

  const exam = attempt.exams as unknown as { title: string };

  const [{ data: sectionsData }, { data: questions }, { data: answers }] = await Promise.all([
    admin
      .from("exam_sections")
      .select("id, title, order_index")
      .eq("exam_id", attempt.exam_id)
      .order("order_index"),
    admin
      .from("exam_questions")
      .select("id, section_id, question_text, points, order_index, exam_options(option_text, is_correct)")
      .eq("exam_id", attempt.exam_id)
      .order("order_index"),
    admin
      .from("exam_answers")
      .select("question_id, is_correct, points_earned, answer_text")
      .eq("attempt_id", attemptId),
  ]);

  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));

  function buildQuestions(sectionId: string | null) {
    return (questions ?? [])
      .filter((q) => q.section_id === sectionId)
      .map((q) => {
        const a = answerByQuestion.get(q.id);
        return {
          questionText: q.question_text,
          points: q.points,
          isCorrect: a?.is_correct ?? null,
          pointsEarned: a?.points_earned ?? 0,
          answerText: a?.answer_text ?? "",
          correctAnswerTexts: (q.exam_options ?? []).filter((o) => o.is_correct).map((o) => o.option_text),
        };
      });
  }

  const sections = [
    ...(sectionsData ?? []).map((s) => ({ title: s.title, questions: buildQuestions(s.id) })),
    { title: null, questions: buildQuestions(null) },
  ].filter((s) => s.questions.length > 0);

  const data: AnswerSheetData = {
    examTitle: exam.title,
    studentFirstName: attempt.student_first_name,
    studentName: attempt.student_name,
    studentNumber: attempt.student_number,
    studentClass: attempt.student_class,
    score: attempt.score ?? 0,
    maxScore: attempt.max_score ?? 0,
    percentage: attempt.percentage ?? 0,
    submittedAt: attempt.submitted_at,
    sections,
  };

  const buffer = await renderToBuffer(<AnswerSheetDocument data={data} />);
  // e.g. "Youssef_Kamal_12_3APIC-4.pdf" — name, roll number, class, each
  // space-safe; missing number/class segments are simply omitted.
  const filenameParts = [
    data.studentFirstName,
    data.studentName,
    attempt.student_number,
    data.studentClass,
  ].filter((part): part is string => !!part && part.trim().length > 0);
  const filename = `${filenameParts.map((p) => p.trim().replace(/\s+/g, "-")).join("_")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
