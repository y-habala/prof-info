"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sequenceFormSchema } from "@/schemas/sequences";

export type SequenceFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return sequenceFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    orderIndex: formData.get("orderIndex") || undefined,
  });
}

function revalidateSequencePaths(unitLevelId: string) {
  revalidatePath("/admin/sequences");
  // The student-facing unit listing page no longer exists — the whole
  // level's unit→séquence→séance outline now lives on one page. Unlike a
  // session, a séquence never had its own standalone content page to
  // additionally target.
  revalidatePath(`/courses/${unitLevelId}`);
}

export async function createSequence(
  unitId: string,
  unitLevelId: string,
  _prevState: SequenceFormState,
  formData: FormData
): Promise<SequenceFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sequences").insert({
    unit_id: unitId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    order_index: parsed.data.orderIndex ?? 0,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidateSequencePaths(unitLevelId);
}

export async function updateSequence(
  id: string,
  unitId: string,
  unitLevelId: string,
  _prevState: SequenceFormState,
  formData: FormData
): Promise<SequenceFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sequences")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      order_index: parsed.data.orderIndex ?? 0,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidateSequencePaths(unitLevelId);
}

export async function toggleSequencePublished(
  id: string,
  unitId: string,
  unitLevelId: string,
  isPublished: boolean
) {
  const supabase = await createClient();
  await supabase.from("sequences").update({ is_published: isPublished }).eq("id", id);
  revalidateSequencePaths(unitLevelId);
}

export async function deleteSequence(id: string, unitId: string, unitLevelId: string) {
  const supabase = await createClient();
  await supabase.from("sequences").delete().eq("id", id);
  revalidateSequencePaths(unitLevelId);
}
