"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { devoirFormSchema } from "@/schemas/devoirs";

export type DevoirFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return devoirFormSchema.safeParse({
    title: formData.get("title"),
    levelId: formData.get("levelId"),
    session: formData.get("session"),
  });
}

export async function createDevoir(
  _prevState: DevoirFormState,
  formData: FormData
): Promise<DevoirFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("devoirs").insert({
    title: parsed.data.title,
    level_id: parsed.data.levelId,
    session: parsed.data.session,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/devoirs");
}

export async function updateDevoir(
  id: string,
  _prevState: DevoirFormState,
  formData: FormData
): Promise<DevoirFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("devoirs")
    .update({
      title: parsed.data.title,
      level_id: parsed.data.levelId,
      session: parsed.data.session,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath("/admin/devoirs");
}

export async function deleteDevoir(id: string) {
  const supabase = await createClient();
  await supabase.from("devoirs").delete().eq("id", id);
  revalidatePath("/admin/devoirs");
}
