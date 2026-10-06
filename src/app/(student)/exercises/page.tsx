import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ExercisesLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: levelFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: levels }, { data: exercises }] = await Promise.all([
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
    (async () => {
      let query = supabase
        .from("exercises")
        .select("id, title, level_id, exercise_questions(count)")
        .eq("is_published", true)
        .order("order_index");
      if (levelFilter) query = query.eq("level_id", levelFilter);
      return query;
    })(),
  ]);

  const levelName = levelFilter
    ? (levels ?? []).find((l) => l.id === levelFilter)?.name ?? null
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exercices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entraîne-toi — tu vois immédiatement si tu as la bonne réponse. Aucune note n&apos;est stockée.
        </p>
      </div>

      {levels && levels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/exercises"
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              !levelFilter
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Tous
          </Link>
          {levels.map((lvl) => (
            <Link
              key={lvl.id}
              href={`/exercises?level=${lvl.id}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                lvl.id === levelFilter
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {lvl.name}
            </Link>
          ))}
        </div>
      ) : null}

      {exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exercises.map((ex) => {
            const count = (ex.exercise_questions as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link key={ex.id} href={`/exercises/${ex.id}`} className="group">
                <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <FileCheck2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{ex.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">
                          {count} question{count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          {levelName
            ? `Aucun exercice publié pour ${levelName}.`
            : "Aucun exercice publié pour le moment."}
        </div>
      )}
    </div>
  );
}
