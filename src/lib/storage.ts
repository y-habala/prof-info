import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/env";

export const LESSON_FILES_BUCKET = "lesson-files";

// Creates the public bucket on first use; "already exists" is the normal case.
export async function ensureLessonFilesBucket() {
  const admin = createAdminClient();
  const { error } = await admin.storage.createBucket(LESSON_FILES_BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
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
  if (error && !error.message.includes("already exists")) {
    console.error("[ensureLessonFilesBucket]", error.message);
  }
}

export function publicFileUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${LESSON_FILES_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
