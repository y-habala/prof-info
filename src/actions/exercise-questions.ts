"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { questionFormSchema, type QuestionFormValues } from "@/schemas/exercises";

export type QuestionActionState = { error?: string } | undefined;

function optionsForType(values: QuestionFormValues) {
  switch (values.questionType) {
    case "qcm_single":
    case "qcm_multiple":
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

export async function createQuestion(
  exerciseId: string,
  nextOrderIndex: number,
  values: QuestionFormValues
): Promise<QuestionActionState> {
  const parsed = questionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data: question, error } = await supabase
    .from("exercise_questions")
    .insert({
      exercise_id: exerciseId,
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
      order_index: nextOrderIndex,
      image_url: parsed.data.imageUrl || null,
      explanation: parsed.data.explanation || null,
    })
    .select("id")
    .single();

  if (error || !question) return { error: "Une erreur est survenue." };

  const options = optionsForType(parsed.data);
  if (options.length > 0) {
    const { error: optionsError } = await supabase
      .from("exercise_options")
      .insert(options.map((o) => ({ ...o, question_id: question.id })));
    if (optionsError) return { error: "Une erreur est survenue." };
  }

  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function updateQuestion(
  questionId: string,
  exerciseId: string,
  values: QuestionFormValues
): Promise<QuestionActionState> {
  const parsed = questionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_questions")
    .update({
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
      image_url: parsed.data.imageUrl || null,
      explanation: parsed.data.explanation || null,
    })
    .eq("id", questionId);

  if (error) return { error: "Une erreur est survenue." };

  // Simplest correct way to keep options in sync with a variable-length,
  // reorderable list: replace them rather than diff/patch individual rows.
  await supabase.from("exercise_options").delete().eq("question_id", questionId);
  const options = optionsForType(parsed.data);
  if (options.length > 0) {
    const { error: optionsError } = await supabase
      .from("exercise_options")
      .insert(options.map((o) => ({ ...o, question_id: questionId })));
    if (optionsError) return { error: "Une erreur est survenue." };
  }

  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function deleteQuestion(questionId: string, exerciseId: string) {
  const supabase = await createClient();
  await supabase.from("exercise_questions").delete().eq("id", questionId);
  revalidatePath(`/admin/exercises/${exerciseId}`);
}

export async function reorderQuestions(exerciseId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("exercise_questions").update({ order_index: index }).eq("id", id)
    )
  );
  revalidatePath(`/admin/exercises/${exerciseId}`);
}
