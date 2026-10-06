"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  BLOCK_TYPES,
  type BlockType,
  textContentSchema,
  imageContentSchema,
  videoContentSchema,
  fileContentSchema,
  exerciseContentSchema,
  interactiveContentSchema,
} from "@/schemas/lesson-blocks";

export type FormState = { error?: string } | undefined;

function revalidate(sessionId: string) {
  revalidatePath(`/admin/curriculum/sessions/${sessionId}`);
  revalidatePath("/admin/curriculum");
  // Student session page is nested under /courses/[level]/[unit]/[seq]/[session] —
  // revalidate the layout so markdown changes show up.
  revalidatePath("/courses", "layout");
}

function validateContent(type: BlockType, content: unknown) {
  const schemas: Record<BlockType, z.ZodTypeAny> = {
    text: textContentSchema,
    image: imageContentSchema,
    video: videoContentSchema,
    file: fileContentSchema,
    exercise: exerciseContentSchema,
    interactive: interactiveContentSchema,
  };
  return schemas[type].safeParse(content);
}

export async function createBlock(
  sessionId: string,
  type: BlockType,
  title: string,
  content: unknown
): Promise<FormState> {
  if (!BLOCK_TYPES.includes(type)) return { error: "Type invalide." };
  const parsed = validateContent(type, content);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("lesson_blocks")
    .select("order_index")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from("lesson_blocks").insert({
    session_id: sessionId,
    type,
    title: title.trim() || null,
    content: parsed.data,
    order_index: nextOrder,
  });
  if (error) return { error: "Une erreur est survenue." };
  revalidate(sessionId);
}

export async function updateBlock(
  blockId: string,
  sessionId: string,
  type: BlockType,
  title: string,
  content: unknown
): Promise<FormState> {
  if (!BLOCK_TYPES.includes(type)) return { error: "Type invalide." };
  const parsed = validateContent(type, content);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_blocks")
    .update({
      type,
      title: title.trim() || null,
      content: parsed.data,
    })
    .eq("id", blockId);
  if (error) return { error: "Une erreur est survenue." };
  revalidate(sessionId);
}

export async function deleteBlock(blockId: string, sessionId: string) {
  const supabase = await createClient();
  await supabase.from("lesson_blocks").delete().eq("id", blockId);
  revalidate(sessionId);
}

export async function toggleBlockPublished(blockId: string, sessionId: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("lesson_blocks").update({ is_published: isPublished }).eq("id", blockId);
  revalidate(sessionId);
}

export async function reorderBlocks(sessionId: string, orderedIds: string[]) {
  const supabase = await createClient();
  // One update per row — fine at this scale (dozens of blocks per session max).
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("lesson_blocks").update({ order_index: idx }).eq("id", id)
    )
  );
  revalidate(sessionId);
}

// Lightweight inline exercise creation — the admin names the exercise and
// gets back an id to attach to an exercise block. Questions are then edited
// in-place via the existing exercise action family.
export async function createInlineExercise(sessionId: string, title: string): Promise<{ id?: string; error?: string }> {
  if (!title.trim()) return { error: "Titre requis." };
  const supabase = await createClient();

  // Resolve the level_id through session → sequence → unit → level
  const { data: ses } = await supabase
    .from("sessions")
    .select("sequences(units(level_id))")
    .eq("id", sessionId)
    .maybeSingle();
  const levelId =
    (ses?.sequences as unknown as { units: { level_id: string } | null } | null)?.units?.level_id ?? null;

  const { data, error } = await supabase
    .from("exercises")
    .insert({ title: title.trim(), level_id: levelId, is_published: true })
    .select("id")
    .single();
  if (error || !data) return { error: "Impossible de créer l'exercice." };
  return { id: data.id };
}
