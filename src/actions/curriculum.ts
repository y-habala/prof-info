"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  levelFormSchema,
  unitFormSchema,
  sequenceFormSchema,
  sessionFormSchema,
} from "@/schemas/curriculum";

export type FormState = { error?: string } | undefined;

function revalidateAll(levelId?: string) {
  revalidatePath("/admin/curriculum");
  revalidatePath("/");
  revalidatePath("/courses");
  if (levelId) revalidatePath(`/courses/${levelId}`);
}

// ---- LEVELS ---------------------------------------------------------------

export async function upsertLevel(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = levelFormSchema.safeParse({
    name: formData.get("name"),
    orderIndex: formData.get("orderIndex") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("levels")
      .update({ name: parsed.data.name, order_index: parsed.data.orderIndex })
      .eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("levels").insert({
      name: parsed.data.name,
      order_index: parsed.data.orderIndex,
    });
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidateAll(id ?? undefined);
}

export async function toggleLevelActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("levels").update({ is_active: isActive }).eq("id", id);
  revalidateAll(id);
}

export async function deleteLevel(id: string) {
  const supabase = await createClient();
  await supabase.from("levels").delete().eq("id", id);
  revalidateAll(id);
}

// ---- UNITS ----------------------------------------------------------------

export async function upsertUnit(
  id: string | null,
  levelId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = unitFormSchema.safeParse({
    title: formData.get("title"),
    orderIndex: formData.get("orderIndex") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("units")
      .update({ title: parsed.data.title, order_index: parsed.data.orderIndex })
      .eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("units").insert({
      level_id: levelId,
      title: parsed.data.title,
      order_index: parsed.data.orderIndex,
    });
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidateAll(levelId);
}

export async function toggleUnitPublished(id: string, levelId: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("units").update({ is_published: isPublished }).eq("id", id);
  revalidateAll(levelId);
}

export async function deleteUnit(id: string, levelId: string) {
  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", id);
  revalidateAll(levelId);
}

// ---- SEQUENCES ------------------------------------------------------------

export async function upsertSequence(
  id: string | null,
  unitId: string,
  levelId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = sequenceFormSchema.safeParse({
    title: formData.get("title"),
    orderIndex: formData.get("orderIndex") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("sequences")
      .update({ title: parsed.data.title, order_index: parsed.data.orderIndex })
      .eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("sequences").insert({
      unit_id: unitId,
      title: parsed.data.title,
      order_index: parsed.data.orderIndex,
    });
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidateAll(levelId);
}

export async function toggleSequencePublished(id: string, levelId: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("sequences").update({ is_published: isPublished }).eq("id", id);
  revalidateAll(levelId);
}

export async function deleteSequence(id: string, levelId: string) {
  const supabase = await createClient();
  await supabase.from("sequences").delete().eq("id", id);
  revalidateAll(levelId);
}

// ---- SESSIONS -------------------------------------------------------------

// `sequenceId` is null for a session attached straight to its unit — some
// units are taught as unité → séance, with no séquence in between. `unitId` is
// always set, so a session's place in the tree never depends on the séquence.
export async function upsertSession(
  id: string | null,
  unitId: string,
  sequenceId: string | null,
  levelId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = sessionFormSchema.safeParse({
    title: formData.get("title"),
    durationMinutes: formData.get("durationMinutes") || "",
    contentMarkdown: formData.get("contentMarkdown") ?? "",
    orderIndex: formData.get("orderIndex") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const duration = parsed.data.durationMinutes === "" ? null : parsed.data.durationMinutes ?? null;
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("sessions")
      .update({
        title: parsed.data.title,
        duration_minutes: duration,
        content_markdown: parsed.data.contentMarkdown ?? "",
        order_index: parsed.data.orderIndex,
      })
      .eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("sessions").insert({
      unit_id: unitId,
      sequence_id: sequenceId,
      title: parsed.data.title,
      duration_minutes: duration,
      content_markdown: parsed.data.contentMarkdown ?? "",
      order_index: parsed.data.orderIndex,
    });
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidateAll(levelId);
}

export async function toggleSessionPublished(id: string, levelId: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("sessions").update({ is_published: isPublished }).eq("id", id);
  revalidateAll(levelId);
}

export async function deleteSession(id: string, levelId: string) {
  const supabase = await createClient();
  await supabase.from("sessions").delete().eq("id", id);
  revalidateAll(levelId);
}
