import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ANNOUNCEMENT_TYPE_LABELS, type ANNOUNCEMENT_TYPES } from "@/schemas/announcements";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("announcements")
    .select("title, description, content, image_url, type, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL
        <img src={item.image_url} alt="" className="w-full rounded-md object-cover" />
      ) : null}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {ANNOUNCEMENT_TYPE_LABELS[item.type as (typeof ANNOUNCEMENT_TYPES)[number]]}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(item.published_at)}</span>
        </div>
        <h1 className="text-2xl font-semibold">{item.title}</h1>
        {item.description ? <p className="text-muted-foreground">{item.description}</p> : null}
      </div>
      {item.content ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{item.content}</div>
      ) : null}
    </div>
  );
}
