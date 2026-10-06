import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnswerSheetDocument, type AnswerSheetData, type AnswerSheetSection } from "@/lib/pdf/answer-sheet";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  // Admin-only — same reasoning as v1: the answer sheet shows full
  // correction (right answers for wrong student answers) and must never
  // be reachable by the student themselves.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { attemptId } = await params;
  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select(
      "id, exam_model_id, student_name, student_first_name, student_number, student_class, score, max_score, submitted_at, exam_models(label, exam_id, exams(title))"
    )
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || !attempt.submitted_at) {
    return new Response("Tentative introuvable.", { status: 404 });
  }
  const modelRow = attempt.exam_models as unknown as {
    label: string;
    exam_id: string;
    exams: { title: string } | null;
  } | null;
  if (!modelRow || !modelRow.exams) return new Response("Examen introuvable.", { status: 404 });

  // Fetch structure + answers for grading
  const [{ data: sections }, { data: questions }, { data: answers }] = await Promise.all([
    admin
      .from("exam_sections")
      .select("id, title, order_index")
      .eq("exam_model_id", attempt.exam_model_id)
      .order("order_index"),
    admin
      .from("exam_questions")
      .select("id, section_id, question_text, points, order_index")
      .eq("exam_model_id", attempt.exam_model_id)
      .order("order_index"),
    admin
      .from("exam_answers")
      .select("question_id, answer_text, is_correct, points_earned")
      .eq("attempt_id", attemptId),
  ]);

  // We need correct option text per question for the "→ correct" annotation.
  // Fetch all options for the questions in this model.
  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: optionsRaw } = await admin
    .from("exam_options")
    .select("question_id, option_text, is_correct")
    .in("question_id", questionIds.length > 0 ? questionIds : ["00000000-0000-0000-0000-000000000000"]);

  const correctByQuestion = new Map<string, string[]>();
  for (const o of optionsRaw ?? []) {
    if (!o.is_correct) continue;
    const arr = correctByQuestion.get(o.question_id) ?? [];
    arr.push(o.option_text);
    correctByQuestion.set(o.question_id, arr);
  }
  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));

  function buildQuestions(sectionId: string | null) {
    return (questions ?? [])
      .filter((q) => q.section_id === sectionId)
      .map((q) => {
        const a = answerByQuestion.get(q.id);
        return {
          questionText: q.question_text,
          points: Number(q.points),
          isCorrect: !!a?.is_correct,
          pointsEarned: Number(a?.points_earned ?? 0),
          answerText: a?.answer_text ?? "",
          correctAnswerTexts: correctByQuestion.get(q.id) ?? [],
        };
      });
  }

  const sectionBlocks: AnswerSheetSection[] = [
    ...(sections ?? []).map((s) => ({ title: s.title, questions: buildQuestions(s.id) })),
    { title: null, questions: buildQuestions(null) },
  ].filter((s) => s.questions.length > 0);

  const settings = await getSettings();

  const data: AnswerSheetData = {
    examTitle: modelRow.exams.title,
    modelLabel: modelRow.label,
    studentFirstName: attempt.student_first_name,
    studentName: attempt.student_name,
    studentNumber: attempt.student_number,
    studentClass: attempt.student_class,
    score: Number(attempt.score ?? 0),
    maxScore: Number(attempt.max_score ?? 0),
    submittedAt: attempt.submitted_at,
    sections: sectionBlocks,
    settings: {
      institution: settings.institution,
      academie: settings.academie,
      direction: settings.direction,
      teacherName: settings.teacher_name,
    },
  };

  const buffer = await renderToBuffer(<AnswerSheetDocument data={data} />);
  const parts = [
    data.studentFirstName,
    data.studentName,
    attempt.student_number,
    data.studentClass,
  ].filter((p): p is string => !!p && p.trim().length > 0);
  const filename = `${parts.map((p) => p.trim().replace(/\s+/g, "-")).join("_")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
