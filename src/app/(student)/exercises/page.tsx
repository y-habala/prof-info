import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SearchFilterBar } from "@/components/layout/search-filter-bar";

export const metadata: Metadata = {
  title: "Exercices — Plateforme Informatique",
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  const { q, level } = await searchParams;
  const supabase = await createClient();

  const [{ data: levels }, exercisesQuery] = await Promise.all([
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
    (() => {
      let query = supabase
        .from("exercises")
        .select("id, title, description, duration_minutes")
        .eq("is_published", true);
      if (level) query = query.eq("level_id", level);
      if (q) query = query.ilike("title", `%${q}%`);
      return query.order("created_at", { ascending: false });
    })(),
  ]);
  const { data: exercises } = exercisesQuery;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Exercices</h1>
      <SearchFilterBar
        searchPlaceholder="Rechercher un exercice…"
        searchDefault={q}
        filterName="level"
        filterLabel="Niveau"
        filterOptions={(levels ?? []).map((l) => ({ value: l.id, label: l.name }))}
        filterDefault={level}
      />
      {exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {exercises.map((ex) => (
            <Link key={ex.id} href={`/exercises/${ex.id}`}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <ListChecks className="size-5" />
                  </div>
                  <CardTitle className="text-base">{ex.title}</CardTitle>
                  {ex.duration_minutes ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {ex.duration_minutes} min
                    </p>
                  ) : null}
                </CardHeader>
                {ex.description ? (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{ex.description}</p>
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucun exercice ne correspond à votre recherche.</p>
      )}
    </div>
  );
}
