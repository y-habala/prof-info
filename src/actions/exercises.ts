"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  exerciseFormSchema,
  exerciseQuestionFormSchema,
} from "@/schemas/exercises";

export type FormState = { error?: string } | undefined;

function revalidateExercise(id?: string) {
  revalidatePath("/admin/exercises");
  if (id) revalidatePath(`/admin/exercises/${id}`);
  revalidatePath("/exercises");
}

// ---- EXERCISES ----------------------------------------------------------

export async function upsertExercise(
  id: string | null,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = exerciseFormSchema.safeParse({
    title: formData.get("title"),
    levelId: formData.get("levelId") ?? "",
    orderIndex: formData.get("orderIndex") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const payload = {
    title: parsed.data.title,
    level_id: parsed.data.levelId || null,
    order_index: parsed.data.orderIndex,
  };
  if (id) {
    const { error } = await supabase.from("exercises").update(payload).eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("exercises").insert(payload);
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidateExercise(id ?? undefined);
}

export async function toggleExercisePublished(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("exercises").update({ is_published: isPublished }).eq("id", id);
  revalidateExercise(id);
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  await supabase.from("exercises").delete().eq("id", id);
  revalidateExercise(id);
}

// ---- EXERCISE QUESTIONS -------------------------------------------------

function defaultOptionsFor(type: string) {
  if (type === "true_false") {
    return [
      { option_text: "Vrai", is_correct: false, order_index: 0 },
      { option_text: "Faux", is_correct: false, order_index: 1 },
    ];
  }
  if (type === "qcm_single" || type === "qcm_multiple" || type === "matching") {
    return [
      { option_text: "", is_correct: false, order_index: 0 },
      { option_text: "", is_correct: false, order_index: 1 },
    ];
  }
  return [];
}

export async function createExerciseQuestion(
  exerciseId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = exerciseQuestionFormSchema.safeParse({
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    points: formData.get("points") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("exercise_questions")
    .select("order_index")
    .eq("exercise_id", exerciseId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from("exercise_questions")
    .insert({
      exercise_id: exerciseId,
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
      order_index: nextOrder,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: "Une erreur est survenue." };

  const defaults = defaultOptionsFor(parsed.data.questionType);
  if (defaults.length > 0) {
    await supabase.from("exercise_options").insert(defaults.map((d) => ({ ...d, question_id: inserted.id })));
  }
  revalidateExercise(exerciseId);
}

export async function updateExerciseQuestion(
  id: string,
  exerciseId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = exerciseQuestionFormSchema.safeParse({
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    points: formData.get("points") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_questions")
    .update({
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
    })
    .eq("id", id);
  if (error) return { error: "Une erreur est survenue." };
  revalidateExercise(exerciseId);
}

export async function deleteExerciseQuestion(id: string, exerciseId: string) {
  const supabase = await createClient();
  await supabase.from("exercise_questions").delete().eq("id", id);
  revalidateExercise(exerciseId);
}

export async function replaceExerciseOptions(
  questionId: string,
  exerciseId: string,
  options: { text: string; isCorrect: boolean }[]
) {
  const supabase = await createClient();
  await supabase.from("exercise_options").delete().eq("question_id", questionId);
  const cleaned = options
    .map((o, i) => ({
      question_id: questionId,
      option_text: o.text.trim(),
      is_correct: o.isCorrect,
      order_index: i,
    }))
    .filter((o) => o.option_text.length > 0);
  if (cleaned.length > 0) {
    await supabase.from("exercise_options").insert(cleaned);
  }
  revalidateExercise(exerciseId);
}
