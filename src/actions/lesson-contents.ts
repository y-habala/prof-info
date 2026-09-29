"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  blockContentSchemas,
  blockTitleSchema,
  type BlockType,
} from "@/schemas/lesson-contents";

export type BlockFormState = { error?: string } | undefined;

function buildContentFromFormData(type: BlockType, formData: FormData): unknown {
  switch (type) {
    case "text":
      return { text: formData.get("content_text") ?? "" };
    case "image":
      return {
        url: formData.get("content_url") ?? "",
        caption: formData.get("content_caption") ?? "",
      };
    case "video":
      return {
        youtube_url: formData.get("content_youtube_url") ?? "",
        video_url: formData.get("content_video_url") ?? "",
      };
    case "pdf":
    case "file":
      return {
        file_url: formData.get("content_file_url") ?? "",
        file_name: formData.get("content_file_name") ?? "",
      };
    case "exercise":
      return { exercise_id: formData.get("content_exercise_id") ?? "" };
  }
}

function parseBlockForm(type: BlockType, formData: FormData) {
  const titleParsed = blockTitleSchema.safeParse(formData.get("title") ?? "");
  if (!titleParsed.success) {
    return { error: titleParsed.error.issues[0]?.message ?? "Titre invalide." } as const;
  }

  const rawContent = buildContentFromFormData(type, formData);
  const contentParsed = blockContentSchemas[type].safeParse(rawContent);
  if (!contentParsed.success) {
    return { error: contentParsed.error.issues[0]?.message ?? "Contenu invalide." } as const;
  }

  return { title: titleParsed.data || null, content: contentParsed.data } as const;
}

export async function createLessonContent(
  sessionId: string,
  type: BlockType,
  nextOrderIndex: number,
  _prevState: BlockFormState,
  formData: FormData
): Promise<BlockFormState> {
  const parsed = parseBlockForm(type, formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_contents").insert({
    session_id: sessionId,
    type,
    title: parsed.title,
    content: parsed.content,
    order_index: nextOrderIndex,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function updateLessonContent(
  id: string,
  sessionId: string,
  type: BlockType,
  _prevState: BlockFormState,
  formData: FormData
): Promise<BlockFormState> {
  const parsed = parseBlockForm(type, formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_contents")
    .update({ title: parsed.title, content: parsed.content })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function toggleLessonContentPublished(
  id: string,
  sessionId: string,
  isPublished: boolean
) {
  const supabase = await createClient();
  await supabase.from("lesson_contents").update({ is_published: isPublished }).eq("id", id);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function deleteLessonContent(id: string, sessionId: string) {
  const supabase = await createClient();
  await supabase.from("lesson_contents").delete().eq("id", id);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function reorderLessonContents(sessionId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("lesson_contents").update({ order_index: index }).eq("id", id)
    )
  );
  revalidatePath(`/admin/sessions/${sessionId}`);
}
