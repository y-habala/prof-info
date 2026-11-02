import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { createAdminClient } from "@/lib/supabase/admin";
import { AnswerSheetDocument, type AnswerSheetData, type AnswerSheetSection } from "@/lib/pdf/answer-sheet";
import type { SettingsBundle } from "@/lib/settings";
import type { PdfLogo } from "@/lib/pdf/logo";
import { clozeDisplayText, correctAnswerText, isInteractive } from "@/lib/exam-interactive";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Corrected answer sheet of one submitted attempt, with its download name.
 * Settings and logo are passed in so a bulk download loads them once.
 * Returns null when the attempt is missing or not submitted yet.
 */
export async function buildAnswerSheetPdf(
  admin: Admin,
  attemptId: string,
  settings: SettingsBundle,
  logo: PdfLogo
): Promise<{ buffer: Buffer; filename: string } | null> {

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select(
      "id, exam_model_id, student_name, student_first_name, student_number, student_class, score, max_score, submitted_at, exam_models(label, exam_id, exams(title, levels(name)))"
    )
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || !attempt.submitted_at) {
    return null;
  }
  const modelRow = attempt.exam_models as unknown as {
    label: string;
    exam_id: string;
    exams: { title: string; levels: { name: string } | null } | null;
  } | null;
  if (!modelRow || !modelRow.exams) return null;

  // Fetch structure + answers for grading
  const [{ data: sections }, { data: questions }, { data: answers }] = await Promise.all([
    admin
      .from("exam_sections")
      .select("id, title, order_index")
      .eq("exam_model_id", attempt.exam_model_id)
      .order("order_index"),
    admin
      .from("exam_questions")
      .select("id, section_id, question_text, question_type, points, order_index")
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
    .select("id, question_id, option_text, is_correct, order_index")
    .in("question_id", questionIds.length > 0 ? questionIds : ["00000000-0000-0000-0000-000000000000"]);

  const correctByQuestion = new Map<string, string[]>();
  const interactiveIds = new Set<string>();
  for (const q of questions ?? []) {
    if (!isInteractive(q.question_type)) continue;
    interactiveIds.add(q.id);
    const opts = (optionsRaw ?? [])
      .filter((o) => o.question_id === q.id)
      .map((o) => ({ id: o.id, text: o.option_text, orderIndex: o.order_index }));
    correctByQuestion.set(q.id, [correctAnswerText(q.question_type, opts, q.question_text)]);
  }
  for (const o of optionsRaw ?? []) {
    if (interactiveIds.has(o.question_id)) continue;
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
          questionText: q.question_type === "cloze" ? clozeDisplayText(q.question_text) : q.question_text,
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


  const data: AnswerSheetData = {
    examTitle: modelRow.exams.title,
    modelLabel: modelRow.label,
    levelName: modelRow.exams.levels?.name ?? null,
    logo,
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
      academieAr: settings.academie_ar,
      directionAr: settings.direction_ar,
      teacherName: settings.teacher_name,
      schoolYear: settings.school_year,
      levelLabels: settings.level_labels,
    },
  };

  const buffer = await renderToBuffer(<AnswerSheetDocument data={data} />);
  // Number first so the downloaded files sort in class-list order.
  const parts = [
    attempt.student_number,
    data.studentFirstName,
    data.studentName,
    data.studentClass,
  ].filter((p): p is string => !!p && p.trim().length > 0);
  const filename = `${parts.map((p) => p.trim().replace(/\s+/g, "-")).join("_")}.pdf`;

  return { buffer, filename };
}
