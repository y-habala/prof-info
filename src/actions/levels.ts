"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { levelFormSchema } from "@/schemas/levels";

export type LevelFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return levelFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    orderIndex: formData.get("orderIndex") || undefined,
  });
}

export async function createLevel(
  _prevState: LevelFormState,
  formData: FormData
): Promise<LevelFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("levels").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    order_index: parsed.data.orderIndex ?? 0,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/levels");
  revalidatePath("/courses");
  revalidatePath("/");
}

export async function updateLevel(
  id: string,
  _prevState: LevelFormState,
  formData: FormData
): Promise<LevelFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("levels")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      order_index: parsed.data.orderIndex ?? 0,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/levels");
  revalidatePath("/courses");
  revalidatePath("/");
}

export async function toggleLevelActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("levels").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/levels");
  revalidatePath("/courses");
  revalidatePath("/");
}

export async function deleteLevel(id: string) {
  const supabase = await createClient();
  await supabase.from("levels").delete().eq("id", id);
  revalidatePath("/admin/levels");
  revalidatePath("/courses");
  revalidatePath("/");
}
