"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accessCodeFormSchema } from "@/schemas/access-codes";

export type AccessCodeFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return accessCodeFormSchema.safeParse({
    code: formData.get("code"),
    label: formData.get("label") ?? "",
    expiresAt: formData.get("expiresAt") ?? "",
  });
}

export async function createAccessCode(
  _prevState: AccessCodeFormState,
  formData: FormData
): Promise<AccessCodeFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("access_codes").insert({
    code: parsed.data.code,
    label: parsed.data.label || null,
    expires_at: parsed.data.expiresAt || null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ce code existe déjà." : "Une erreur est survenue.",
    };
  }

  revalidatePath("/admin/access-codes");
}

export async function updateAccessCode(
  id: string,
  _prevState: AccessCodeFormState,
  formData: FormData
): Promise<AccessCodeFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("access_codes")
    .update({
      code: parsed.data.code,
      label: parsed.data.label || null,
      expires_at: parsed.data.expiresAt || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "Ce code existe déjà." : "Une erreur est survenue.",
    };
  }

  revalidatePath("/admin/access-codes");
}

export async function toggleAccessCodeActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("access_codes").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/access-codes");
}

export async function deleteAccessCode(id: string) {
  const supabase = await createClient();
  await supabase.from("access_codes").delete().eq("id", id);
  revalidatePath("/admin/access-codes");
}
