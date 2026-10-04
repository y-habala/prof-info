import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("announcements")
    .select("id, title, slug, description, image_url, published_at")
    .eq("is_published", true);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data: announcements } = await query.order("published_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Actualités</h1>
      <form method="GET" className="flex items-center gap-2">
        <input
          type="text"
          name="q"
          placeholder="Rechercher une actualité…"
          defaultValue={q ?? ""}
          className="h-9 flex-1 max-w-sm rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          className="h-9 rounded-lg border border-input bg-transparent px-4 text-sm hover:bg-muted"
        >
          Rechercher
        </button>
      </form>
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
                  <span className="text-xs text-muted-foreground">{formatDate(item.published_at)}</span>
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
