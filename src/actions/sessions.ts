"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sessionFormSchema } from "@/schemas/sessions";

export type SessionFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return sessionFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    durationMinutes: formData.get("durationMinutes") || undefined,
    orderIndex: formData.get("orderIndex") || undefined,
  });
}

// The student-facing unit/sequence listing pages no longer exist — the
// whole level's unit→séquence→séance outline lives on one page — but the
// session's own content page is still a real route and still needs its
// own revalidation (a pre-existing gap: the previous version of this
// helper never revalidated it either, only the now-deleted sequence
// listing above it). sessionId is omitted for createSession, where the
// page doesn't exist yet until the next request fetches it fresh anyway.
function revalidateSessionPaths(levelId: string, unitId: string, sequenceId: string, sessionId?: string) {
  revalidatePath("/admin/sessions");
  revalidatePath(`/courses/${levelId}`);
  if (sessionId) {
    revalidatePath(`/courses/${levelId}/${unitId}/${sequenceId}/${sessionId}`);
  }
}

export async function createSession(
  sequenceId: string,
  unitId: string,
  levelId: string,
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert({
    sequence_id: sequenceId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    duration_minutes: parsed.data.durationMinutes ?? null,
    order_index: parsed.data.orderIndex ?? 0,
  });

  if (error) return { error: "Une erreur est survenue." };
  revalidateSessionPaths(levelId, unitId, sequenceId);
}

export async function updateSession(
  id: string,
  sequenceId: string,
  unitId: string,
  levelId: string,
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      duration_minutes: parsed.data.durationMinutes ?? null,
      order_index: parsed.data.orderIndex ?? 0,
    })
    .eq("id", id);

  if (error) return { error: "Une erreur est survenue." };
  revalidateSessionPaths(levelId, unitId, sequenceId, id);
}

export async function toggleSessionPublished(
  id: string,
  sequenceId: string,
  unitId: string,
  levelId: string,
  isPublished: boolean
) {
  const supabase = await createClient();
  await supabase.from("sessions").update({ is_published: isPublished }).eq("id", id);
  revalidateSessionPaths(levelId, unitId, sequenceId, id);
}

export async function deleteSession(
  id: string,
  sequenceId: string,
  unitId: string,
  levelId: string
) {
  const supabase = await createClient();
  await supabase.from("sessions").delete().eq("id", id);
  revalidateSessionPaths(levelId, unitId, sequenceId, id);
}
