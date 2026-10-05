"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;

const KEYS = ["teacher_name", "institution", "academie", "direction"] as const;

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const upserts = KEYS.map((key) => ({
    key,
    value: String(formData.get(key) ?? "").trim(),
  }));
  const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" });
  if (error) return { error: "Une erreur est survenue." };

  revalidatePath("/", "layout");
  return { success: true };
}
