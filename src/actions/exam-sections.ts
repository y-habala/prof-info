"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { examSectionFormSchema } from "@/schemas/exams";

export type ExamSectionActionState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return examSectionFormSchema.safeParse({
    title: formData.get("title"),
    imageUrl: formData.get("imageUrl") ?? "",
  });
}

export async function createExamSection(
  examId: string,
  nextOrderIndex: number,
  _prevState: ExamSectionActionState,
  formData: FormData
): Promise<ExamSectionActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("exam_sections").insert({
    exam_id: examId,
    title: parsed.data.title,
    image_url: parsed.data.imageUrl || null,
    order_index: nextOrderIndex,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath(`/admin/exams/${examId}`);
}

export async function updateExamSection(
  sectionId: string,
  examId: string,
  _prevState: ExamSectionActionState,
  formData: FormData
): Promise<ExamSectionActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_sections")
    .update({ title: parsed.data.title, image_url: parsed.data.imageUrl || null })
    .eq("id", sectionId);

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath(`/admin/exams/${examId}`);
}

export async function deleteExamSection(sectionId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_sections").delete().eq("id", sectionId);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function reorderExamSections(examId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("exam_sections").update({ order_index: index }).eq("id", id)
    )
  );
  revalidatePath(`/admin/exams/${examId}`);
}
