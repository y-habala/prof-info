"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { examFormSchema } from "@/schemas/exams";

export type ExamFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return examFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    levelId: formData.get("levelId") ?? "",
    devoirId: formData.get("devoirId") ?? "",
    durationMinutes: formData.get("durationMinutes"),
    secretCode: formData.get("secretCode"),
    startAt: formData.get("startAt") ?? "",
    endAt: formData.get("endAt") ?? "",
    maxAttempts: formData.get("maxAttempts") || 1,
  });
}

export async function createExam(
  _prevState: ExamFormState,
  formData: FormData
): Promise<ExamFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("exams").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    level_id: parsed.data.levelId || null,
    devoir_id: parsed.data.devoirId || null,
    duration_minutes: parsed.data.durationMinutes,
    secret_code: parsed.data.secretCode,
    start_at: parsed.data.startAt || null,
    end_at: parsed.data.endAt || null,
    max_attempts: parsed.data.maxAttempts,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/exams");
}

export async function updateExam(
  id: string,
  _prevState: ExamFormState,
  formData: FormData
): Promise<ExamFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exams")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      level_id: parsed.data.levelId || null,
      devoir_id: parsed.data.devoirId || null,
      duration_minutes: parsed.data.durationMinutes,
      secret_code: parsed.data.secretCode,
      start_at: parsed.data.startAt || null,
      end_at: parsed.data.endAt || null,
      max_attempts: parsed.data.maxAttempts,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${id}`);
}

export async function toggleExamPublished(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("exams").update({ is_published: isPublished }).eq("id", id);
  revalidatePath("/admin/exams");
}

export async function toggleExamActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("exams").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/exams");
}

export async function deleteExam(id: string) {
  const supabase = await createClient();
  await supabase.from("exams").delete().eq("id", id);
  revalidatePath("/admin/exams");
}
