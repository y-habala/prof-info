"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/env";

const BUCKET = "lesson-files";

// Ensure the public bucket exists on first use.
async function ensureBucket() {
  const admin = createAdminClient();
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20 MB
    allowedMimeTypes: [
      "image/*",
      "video/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  });
  // Ignore "already exists" error
  if (error && !error.message.includes("already exists")) {
    console.error("[ensureBucket]", error.message);
  }
}

export type FileItem = {
  name: string;
  path: string;
  publicUrl: string;
  size: number;
  mimeType: string;
  updatedAt: string;
};

export async function listFiles(): Promise<{ files: FileItem[]; error?: string }> {
  await ensureBucket();
  const admin = createAdminClient();

  const { data, error } = await admin.storage.from(BUCKET).list("", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) return { files: [], error: error.message };

  const files: FileItem[] = (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name,
      path: f.name,
      publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(f.name)}`,
      size: f.metadata?.size ?? 0,
      mimeType: f.metadata?.mimetype ?? "",
      updatedAt: f.updated_at ?? f.created_at ?? "",
    }));

  return { files };
}

export async function uploadFile(
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
  await ensureBucket();
  const admin = createAdminClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Aucun fichier fourni." };
  if (file.size > 20 * 1024 * 1024) return { error: "Fichier trop volumineux (max 20 Mo)." };

  // Sanitise filename: strip dangerous chars, keep extension
  const ext = file.name.split(".").pop() ?? "";
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w؀-ۿÀ-ɏ\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
  const safeName = `${base || "fichier"}_${Date.now()}${ext ? `.${ext}` : ""}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(safeName, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { error: error.message };

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(safeName)}`;
  return { publicUrl };
}

export async function deleteFile(
  path: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) return { error: error.message };
  return {};
}
