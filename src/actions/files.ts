"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UploadState = { url?: string; error?: string } | undefined;

const BUCKETS = ["lesson-images", "lesson-files", "documents"] as const;
export type Bucket = (typeof BUCKETS)[number];

// Server Actions are callable directly (they're just POST endpoints under
// the hood), so re-validate the bucket at runtime rather than trusting the
// caller's TypeScript type.
function assertBucket(bucket: Bucket) {
  if (!BUCKETS.includes(bucket)) {
    throw new Error("Invalid bucket");
  }
}

function randomFileName(originalName: string) {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "";
  const id = crypto.randomUUID();
  return ext ? `${id}.${ext}` : id;
}

export async function uploadFile(bucket: Bucket, formData: FormData): Promise<UploadState> {
  assertBucket(bucket);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Veuillez sélectionner un fichier." };
  }

  const supabase = await createClient();
  const path = randomFileName(file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file);

  if (error) {
    return { error: "Échec du téléversement. Vérifiez le type et la taille du fichier." };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  revalidatePath("/admin/files");
  return { url: data.publicUrl };
}

export type StorageFile = { name: string; url: string; size: number; createdAt: string };

export async function listFiles(bucket: Bucket): Promise<StorageFile[]> {
  assertBucket(bucket);
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(bucket)
    .list("", { sortBy: { column: "created_at", order: "desc" } });

  return (data ?? [])
    .filter((f) => f.id) // folders have no id
    .map((f) => ({
      name: f.name,
      url: supabase.storage.from(bucket).getPublicUrl(f.name).data.publicUrl,
      size: f.metadata?.size ?? 0,
      createdAt: f.created_at ?? "",
    }));
}

export async function deleteFile(bucket: Bucket, name: string) {
  assertBucket(bucket);
  const supabase = await createClient();
  await supabase.storage.from(bucket).remove([name]);
  revalidatePath("/admin/files");
}
