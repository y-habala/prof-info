import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Exercices — Plateforme Informatique",
};

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, title, description, duration_minutes")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Exercices</h1>
      {exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {exercises.map((ex) => (
            <Link key={ex.id} href={`/exercises/${ex.id}`}>
              <Card className="h-full transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle>{ex.title}</CardTitle>
                  {ex.duration_minutes ? (
                    <p className="text-sm text-muted-foreground">{ex.duration_minutes} min</p>
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
        <p className="text-muted-foreground">Aucun exercice disponible pour le moment.</p>
      )}
    </div>
  );
}
