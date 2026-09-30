"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  examQuestionFormSchema,
  matchingSetSchema,
  type ExamQuestionFormValues,
  type MatchingSetFormValues,
} from "@/schemas/exams";

export type ExamQuestionActionState = { error?: string } | undefined;

function optionsForType(values: ExamQuestionFormValues) {
  switch (values.questionType) {
    case "qcm_single":
    case "qcm_multiple":
    case "matching":
      return values.options.map((o, i) => ({
        option_text: o.text,
        is_correct: o.isCorrect,
        order_index: i,
      }));
    case "true_false":
      return [
        { option_text: "Vrai", is_correct: values.options[0]?.isCorrect === true, order_index: 0 },
        { option_text: "Faux", is_correct: values.options[0]?.isCorrect === false, order_index: 1 },
      ];
    case "fill_blank":
      return values.correctText
        ? [{ option_text: values.correctText, is_correct: true, order_index: 0 }]
        : [];
    case "open":
      return [];
  }
}

export async function createExamQuestion(
  examId: string,
  nextOrderIndex: number,
  values: ExamQuestionFormValues,
  sectionId?: string | null
): Promise<ExamQuestionActionState> {
  const parsed = examQuestionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data: question, error } = await supabase
    .from("exam_questions")
    .insert({
      exam_id: examId,
      section_id: sectionId ?? null,
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
      order_index: nextOrderIndex,
    })
    .select("id")
    .single();

  if (error || !question) return { error: "Une erreur est survenue." };

  const options = optionsForType(parsed.data);
  if (options.length > 0) {
    const { error: optionsError } = await supabase
      .from("exam_options")
      .insert(options.map((o) => ({ ...o, question_id: question.id })));
    if (optionsError) return { error: "Une erreur est survenue." };
  }

  revalidatePath(`/admin/exams/${examId}`);
}

export async function updateExamQuestion(
  questionId: string,
  examId: string,
  values: ExamQuestionFormValues
): Promise<ExamQuestionActionState> {
  const parsed = examQuestionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_questions")
    .update({
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
    })
    .eq("id", questionId);

  if (error) return { error: "Une erreur est survenue." };

  await supabase.from("exam_options").delete().eq("question_id", questionId);
  const options = optionsForType(parsed.data);
  if (options.length > 0) {
    const { error: optionsError } = await supabase
      .from("exam_options")
      .insert(options.map((o) => ({ ...o, question_id: questionId })));
    if (optionsError) return { error: "Une erreur est survenue." };
  }

  revalidatePath(`/admin/exams/${examId}`);
}

export async function deleteExamQuestion(questionId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_questions").delete().eq("id", questionId);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function reorderExamQuestions(examId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("exam_questions").update({ order_index: index }).eq("id", id)
    )
  );
  revalidatePath(`/admin/exams/${examId}`);
}

export async function moveExamQuestionToSection(
  questionId: string,
  examId: string,
  sectionId: string | null
) {
  const supabase = await createClient();
  await supabase.from("exam_questions").update({ section_id: sectionId }).eq("id", questionId);
  revalidatePath(`/admin/exams/${examId}`);
}

export type MatchingSetActionState = { error?: string } | undefined;

// Authors an entire matching set (several pairs sharing one option pool) in
// one call, so every pair's dropdown shows the exact same choices — see
// schemas/exams.ts's matchingSetSchema for why this exists instead of
// creating each pair through createExamQuestion one at a time.
export async function createMatchingSet(
  examId: string,
  nextOrderIndex: number,
  values: MatchingSetFormValues,
  sectionId?: string | null
): Promise<MatchingSetActionState> {
  const parsed = matchingSetSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { pool, pairs, points } = parsed.data;

  const { data: questions, error } = await supabase
    .from("exam_questions")
    .insert(
      pairs.map((pair, i) => ({
        exam_id: examId,
        section_id: sectionId ?? null,
        question_text: pair.prompt,
        question_type: "matching",
        points,
        order_index: nextOrderIndex + i,
      }))
    )
    .select("id");

  if (error || !questions || questions.length !== pairs.length) {
    return { error: "Une erreur est survenue." };
  }

  const optionRows = questions.flatMap((question, pairIndex) =>
    pool.map((text, poolIndex) => ({
      question_id: question.id,
      option_text: text,
      is_correct: poolIndex === pairs[pairIndex].correctPoolIndex,
      order_index: poolIndex,
    }))
  );

  const { error: optionsError } = await supabase.from("exam_options").insert(optionRows);
  if (optionsError) return { error: "Une erreur est survenue." };

  revalidatePath(`/admin/exams/${examId}`);
}
