"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  code: z.string().regex(/^\d{4}$/, "Le code doit contenir exactement 4 chiffres."),
  label: z.string().trim().max(100).optional().or(z.literal("")),
});

export type FormState = { error?: string } | undefined;

export async function upsertAccessCode(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ code: formData.get("code"), label: formData.get("label") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const supabase = await createClient();
  const label = parsed.data.label || null;
  if (id) {
    const { error } = await supabase.from("access_codes").update({ code: parsed.data.code, label }).eq("id", id);
    if (error) return { error: error.code === "23505" ? "Code déjà utilisé." : "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("access_codes").insert({ code: parsed.data.code, label });
    if (error) return { error: error.code === "23505" ? "Code déjà utilisé." : "Une erreur est survenue." };
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
