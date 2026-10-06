"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;

const FIXED_KEYS = ["teacher_name", "institution", "academie", "direction"] as const;

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const upserts: { key: string; value: string }[] = FIXED_KEYS.map((key) => ({
    key,
    value: String(formData.get(key) ?? "").trim(),
  }));

  // Collect class counts from fields named "class_count_{levelName}"
  const classCounts: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("class_count_")) {
      const levelName = key.slice("class_count_".length);
      const n = parseInt(String(value), 10);
      if (levelName && !isNaN(n) && n >= 0) classCounts[levelName] = n;
    }
  }
  upserts.push({ key: "class_counts", value: JSON.stringify(classCounts) });

  const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" });
  if (error) return { error: "Une erreur est survenue." };

  revalidatePath("/", "layout");
  return { success: true };
}
