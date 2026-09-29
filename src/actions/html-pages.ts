"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { htmlPageFormSchema } from "@/schemas/html-pages";

export type HtmlPageFormState = { error?: string } | undefined;
// next/navigation's redirect() only auto-navigates the client when a
// Server Action is invoked via native <form action={...}> dispatch — it
// does NOT when called manually via `await someAction(...)` from inside a
// wrapper handler (confirmed empirically: the DB write succeeded but the
// browser never moved). HtmlPageEditor calls this manually, so on success
// we return the new id and let the client do router.push() itself instead.
export type CreateHtmlPageResult = { error?: string; id?: string };

function parseForm(formData: FormData) {
  return htmlPageFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    slug: formData.get("slug"),
    levelId: formData.get("levelId") ?? "",
    unitId: formData.get("unitId") ?? "",
    sequenceId: formData.get("sequenceId") ?? "",
    sessionId: formData.get("sessionId") ?? "",
    htmlContent: formData.get("htmlContent") ?? "",
    cssContent: formData.get("cssContent") ?? "",
    javascriptContent: formData.get("javascriptContent") ?? "",
  });
}

export async function createHtmlPage(
  _prevState: HtmlPageFormState,
  formData: FormData
): Promise<CreateHtmlPageResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("html_pages")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      slug: parsed.data.slug,
      level_id: parsed.data.levelId || null,
      unit_id: parsed.data.unitId || null,
      sequence_id: parsed.data.sequenceId || null,
      session_id: parsed.data.sessionId || null,
      html_content: parsed.data.htmlContent,
      css_content: parsed.data.cssContent,
      javascript_content: parsed.data.javascriptContent,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.code === "23505" ? "Ce slug est déjà utilisé." : "Une erreur est survenue.",
    };
  }
  revalidatePath("/admin/html-pages");
  return { id: data.id };
}

export async function updateHtmlPage(
  id: string,
  _prevState: HtmlPageFormState,
  formData: FormData
): Promise<HtmlPageFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("html_pages")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      slug: parsed.data.slug,
      level_id: parsed.data.levelId || null,
      unit_id: parsed.data.unitId || null,
      sequence_id: parsed.data.sequenceId || null,
      session_id: parsed.data.sessionId || null,
      html_content: parsed.data.htmlContent,
      css_content: parsed.data.cssContent,
      javascript_content: parsed.data.javascriptContent,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "Ce slug est déjà utilisé." : "Une erreur est survenue.",
    };
  }
  revalidatePath("/admin/html-pages");
  revalidatePath(`/admin/html-pages/${id}`);
}

export async function toggleHtmlPagePublished(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("html_pages").update({ is_published: isPublished }).eq("id", id);
  revalidatePath("/admin/html-pages");
}

export async function deleteHtmlPage(id: string) {
  const supabase = await createClient();
  await supabase.from("html_pages").delete().eq("id", id);
  revalidatePath("/admin/html-pages");
}
