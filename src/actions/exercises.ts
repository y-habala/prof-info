"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exerciseFormSchema } from "@/schemas/exercises";

export type ExerciseFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return exerciseFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    levelId: formData.get("levelId") ?? "",
    unitId: formData.get("unitId") ?? "",
    sequenceId: formData.get("sequenceId") ?? "",
    sessionId: formData.get("sessionId") ?? "",
    durationMinutes: formData.get("durationMinutes") || undefined,
  });
}

export async function createExercise(
  _prevState: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      level_id: parsed.data.levelId || null,
      unit_id: parsed.data.unitId || null,
      sequence_id: parsed.data.sequenceId || null,
      session_id: parsed.data.sessionId || null,
      duration_minutes: parsed.data.durationMinutes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/exercises");
  return undefined;
}

export async function updateExercise(
  id: string,
  _prevState: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      level_id: parsed.data.levelId || null,
      unit_id: parsed.data.unitId || null,
      sequence_id: parsed.data.sequenceId || null,
      session_id: parsed.data.sessionId || null,
      duration_minutes: parsed.data.durationMinutes ?? null,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${id}`);
}

export async function toggleExercisePublished(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("exercises").update({ is_published: isPublished }).eq("id", id);
  revalidatePath("/admin/exercises");
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  await supabase.from("exercises").delete().eq("id", id);
  revalidatePath("/admin/exercises");
}

export async function duplicateExercise(id: string) {
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("exercises")
    .select("*, exercise_questions(*, exercise_options(*))")
    .eq("id", id)
    .single();

  if (!original) return;

  const { data: copy } = await supabase
    .from("exercises")
    .insert({
      title: `${original.title} (copie)`,
      description: original.description,
      level_id: original.level_id,
      unit_id: original.unit_id,
      sequence_id: original.sequence_id,
      session_id: original.session_id,
      duration_minutes: original.duration_minutes,
      is_published: false,
    })
    .select("id")
    .single();

  if (!copy) return;

  type OriginalQuestion = {
    question_text: string;
    question_type: string;
    points: number;
    order_index: number;
    image_url: string | null;
    explanation: string | null;
    exercise_options: { option_text: string; is_correct: boolean; order_index: number }[];
  };

  for (const q of (original.exercise_questions ?? []) as OriginalQuestion[]) {
    const { data: newQuestion } = await supabase
      .from("exercise_questions")
      .insert({
        exercise_id: copy.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        order_index: q.order_index,
        image_url: q.image_url,
        explanation: q.explanation,
      })
      .select("id")
      .single();

    if (newQuestion && q.exercise_options.length > 0) {
      await supabase.from("exercise_options").insert(
        q.exercise_options.map((o) => ({
          question_id: newQuestion.id,
          option_text: o.option_text,
          is_correct: o.is_correct,
          order_index: o.order_index,
        }))
      );
    }
  }

  revalidatePath("/admin/exercises");
}
