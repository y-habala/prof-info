import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ANNOUNCEMENT_TYPE_LABELS, type ANNOUNCEMENT_TYPES } from "@/schemas/announcements";

export const metadata: Metadata = {
  title: "Actualités — Plateforme Informatique",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, slug, description, image_url, type, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Actualités</h1>
      {announcements && announcements.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {announcements.map((item) => (
            <Link key={item.id} href={`/actualites/${item.slug}`}>
              <Card className="h-full overflow-hidden transition-colors hover:border-foreground/30">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="h-40 w-full object-cover" />
                ) : null}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {ANNOUNCEMENT_TYPE_LABELS[item.type as (typeof ANNOUNCEMENT_TYPES)[number]]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(item.published_at)}</span>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                {item.description ? (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucune actualité pour le moment.</p>
      )}
    </div>
  );
}
