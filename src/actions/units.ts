"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { unitFormSchema } from "@/schemas/units";

export type UnitFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return unitFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    orderIndex: formData.get("orderIndex") || undefined,
  });
}

function revalidateUnitPaths(levelId: string) {
  revalidatePath("/admin/units");
  revalidatePath(`/courses/${levelId}`);
}

export async function createUnit(
  levelId: string,
  _prevState: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("units").insert({
    level_id: levelId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    image_url: parsed.data.imageUrl || null,
    order_index: parsed.data.orderIndex ?? 0,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidateUnitPaths(levelId);
}

export async function updateUnit(
  id: string,
  levelId: string,
  _prevState: UnitFormState,
  formData: FormData
): Promise<UnitFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("units")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      image_url: parsed.data.imageUrl || null,
      order_index: parsed.data.orderIndex ?? 0,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidateUnitPaths(levelId);
}

export async function toggleUnitPublished(id: string, levelId: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("units").update({ is_published: isPublished }).eq("id", id);
  revalidateUnitPaths(levelId);
}

export async function deleteUnit(id: string, levelId: string) {
  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", id);
  revalidateUnitPaths(levelId);
}
