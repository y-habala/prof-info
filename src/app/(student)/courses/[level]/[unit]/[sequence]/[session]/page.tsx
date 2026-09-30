import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";
import {
  ContentBlockRenderer,
  type HtmlPageCode,
  type PublishedBlock,
} from "@/components/courses/content-block-renderer";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ level: string; unit: string; sequence: string; session: string }>;
}) {
  const { level: levelId, unit: unitId, sequence: sequenceId, session: sessionId } = await params;
  const supabase = await createClient();

  const { data: level } = await supabase
    .from("levels")
    .select("id, name")
    .eq("id", levelId)
    .eq("is_active", true)
    .maybeSingle();

  if (!level) {
    notFound();
  }

  const { data: unit } = await supabase
    .from("units")
    .select("id, title")
    .eq("id", unitId)
    .eq("level_id", level.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!unit) {
    notFound();
  }

  const { data: sequence } = await supabase
    .from("sequences")
    .select("id, title")
    .eq("id", sequenceId)
    .eq("unit_id", unit.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!sequence) {
    notFound();
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, description, duration_minutes")
    .eq("id", sessionId)
    .eq("sequence_id", sequence.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const { data: blocks } = await supabase
    .from("lesson_contents")
    .select("id, type, title, content")
    .eq("session_id", session.id)
    .eq("is_published", true)
    .order("order_index");

  const htmlPageIds = (blocks as PublishedBlock[] | null ?? [])
    .filter((block) => block.type === "html" && block.content.html_page_id)
    .map((block) => block.content.html_page_id as string);

  const htmlPages: Record<string, HtmlPageCode> = {};
  if (htmlPageIds.length > 0) {
    const { data: htmlPagesData } = await supabase
      .from("html_pages")
      .select("id, html_content, css_content, javascript_content")
      .in("id", htmlPageIds)
      .eq("is_published", true);
    for (const page of htmlPagesData ?? []) {
      htmlPages[page.id] = {
        html_content: page.html_content,
        css_content: page.css_content,
        javascript_content: page.javascript_content,
      };
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <CourseBreadcrumb
        segments={[
          { label: level.name, href: `/courses/${level.id}` },
          { label: unit.title, href: `/courses/${level.id}/${unit.id}` },
          { label: sequence.title, href: `/courses/${level.id}/${unit.id}/${sequence.id}` },
          { label: session.title },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
        {session.duration_minutes ? (
          <p className="text-sm text-muted-foreground">{session.duration_minutes} min</p>
        ) : null}
        {session.description ? (
          <p className="mt-1 text-muted-foreground">{session.description}</p>
        ) : null}
      </div>
      {blocks && blocks.length > 0 ? (
        <div className="space-y-4">
          {(blocks as PublishedBlock[]).map((block) => (
            <ContentBlockRenderer key={block.id} block={block} htmlPages={htmlPages} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucun contenu disponible pour le moment.</p>
      )}
    </div>
  );
}
