import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SandboxedActivity } from "@/components/activities/sandboxed-activity";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("html_pages")
    .select("title, description, html_content, css_content, javascript_content")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{page.title}</h1>
        {page.description ? (
          <p className="mt-1 text-muted-foreground">{page.description}</p>
        ) : null}
      </div>
      <SandboxedActivity
        html={page.html_content}
        css={page.css_content}
        javascript={page.javascript_content}
      />
    </div>
  );
}
