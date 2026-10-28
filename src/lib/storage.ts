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

// Already exists in the project and accepts PNG/JPEG (lesson-files does not).
export const LESSON_IMAGES_BUCKET = "lesson-images";

export function publicFileUrl(path: string, bucket: string = LESSON_FILES_BUCKET) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
