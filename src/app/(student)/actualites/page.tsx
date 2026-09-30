import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchFilterBar } from "@/components/layout/search-filter-bar";
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_TYPE_LABELS } from "@/schemas/announcements";

export const metadata: Metadata = {
  title: "Actualités — Plateforme Informatique",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("announcements")
    .select("id, title, slug, description, image_url, type, published_at")
    .eq("is_published", true);
  if (type) query = query.eq("type", type);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data: announcements } = await query.order("published_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Actualités</h1>
      <SearchFilterBar
        searchPlaceholder="Rechercher une actualité…"
        searchDefault={q}
        filterName="type"
        filterLabel="Type"
        filterOptions={ANNOUNCEMENT_TYPES.map((t) => ({ value: t, label: ANNOUNCEMENT_TYPE_LABELS[t] }))}
        filterDefault={type}
      />
      {announcements && announcements.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {announcements.map((item) => (
            <Link key={item.id} href={`/actualites/${item.slug}`}>
              <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-accent">
                    <Megaphone className="size-10 text-accent-foreground" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {ANNOUNCEMENT_TYPE_LABELS[item.type as (typeof ANNOUNCEMENT_TYPES)[number]]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(item.published_at)}</span>
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
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
        <p className="text-muted-foreground">Aucune actualité ne correspond à votre recherche.</p>
      )}
    </div>
  );
}
