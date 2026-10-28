"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LESSON_IMAGES_BUCKET, publicFileUrl } from "@/lib/storage";

export type FormState = { error?: string; success?: boolean } | undefined;

const FIXED_KEYS = [
  "teacher_name",
  "institution",
  "academie",
  "direction",
  "academie_ar",
  "direction_ar",
] as const;

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

// The PDF renderer only decodes PNG and JPEG.
const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg" };
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export async function uploadExamLogo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucun fichier fourni." };
  const ext = LOGO_TYPES[file.type];
  if (!ext) return { error: "Format non pris en charge : utilise une image PNG ou JPG." };
  if (file.size > LOGO_MAX_BYTES) return { error: "Image trop lourde (2 Mo maximum)." };

  const path = `branding/exam-logo-${Date.now()}.${ext}`;
  const { error: uploadError } = await createAdminClient()
    .storage.from(LESSON_IMAGES_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[uploadExamLogo]", uploadError.message);
    return { error: `Échec de l'envoi de l'image : ${uploadError.message}` };
  }

  const url = publicFileUrl(path, LESSON_IMAGES_BUCKET);
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "exam_logo_url", value: url }, { onConflict: "key" });
  if (error) return { error: "Une erreur est survenue." };

  revalidatePath("/admin/settings");
  return { url };
}

export async function removeExamLogo(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé." };

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "exam_logo_url", value: "" }, { onConflict: "key" });
  if (error) return { error: "Une erreur est survenue." };

  revalidatePath("/admin/settings");
  return {};
}
