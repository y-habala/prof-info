"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { announcementFormSchema } from "@/schemas/announcements";

export type AnnouncementFormState = { error?: string } | undefined;

function parseForm(formData: FormData) {
  return announcementFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    content: formData.get("content") ?? "",
    slug: formData.get("slug"),
    imageUrl: formData.get("imageUrl") ?? "",
    type: formData.get("type"),
  });
}

export async function createAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    content: parsed.data.content || null,
    slug: parsed.data.slug,
    image_url: parsed.data.imageUrl || null,
    type: parsed.data.type,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ce slug est déjà utilisé." : "Une erreur est survenue.",
    };
  }
  revalidatePath("/admin/announcements");
}

export async function updateAnnouncement(
  id: string,
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      content: parsed.data.content || null,
      slug: parsed.data.slug,
      image_url: parsed.data.imageUrl || null,
      type: parsed.data.type,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "Ce slug est déjà utilisé." : "Une erreur est survenue.",
    };
  }
  revalidatePath("/admin/announcements");
  revalidatePath("/actualites");
}

export async function toggleAnnouncementPublished(id: string, isPublished: boolean) {
  const supabase = await createClient();

  if (isPublished) {
    const { data: existing } = await supabase
      .from("announcements")
      .select("published_at")
      .eq("id", id)
      .single();
    await supabase
      .from("announcements")
      .update({
        is_published: true,
        published_at: existing?.published_at ?? new Date().toISOString(),
      })
      .eq("id", id);
  } else {
    await supabase.from("announcements").update({ is_published: false }).eq("id", id);
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/actualites");
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/actualites");
}
