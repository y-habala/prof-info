import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurriculumTree } from "@/lib/curriculum";
import { HtmlPageEditor } from "@/components/admin/html-pages/html-page-editor";

export const metadata: Metadata = {
  title: "Modifier l'activité HTML — Administration",
};

export default async function EditHtmlPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: page }, tree] = await Promise.all([
    supabase
      .from("html_pages")
      .select(
        "id, title, description, slug, level_id, unit_id, sequence_id, session_id, html_content, css_content, javascript_content"
      )
      .eq("id", id)
      .maybeSingle(),
    getCurriculumTree(),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/html-pages"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Retour aux activités
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Modifier — {page.title}</h1>
      </div>
      <HtmlPageEditor
        mode="edit"
        tree={tree}
        initialValues={{
          id: page.id,
          title: page.title,
          description: page.description,
          slug: page.slug,
          levelId: page.level_id,
          unitId: page.unit_id,
          sequenceId: page.sequence_id,
          sessionId: page.session_id,
          htmlContent: page.html_content,
          cssContent: page.css_content,
          javascriptContent: page.javascript_content,
        }}
      />
    </div>
  );
}
