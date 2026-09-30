import { createClient } from "@/lib/supabase/server";
import { LevelCard } from "@/components/courses/level-card";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name, description")
    .eq("is_active", true)
    .order("order_index");

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Apprendre l&apos;informatique,{" "}
          <span className="text-primary">simplement</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Cours, exercices interactifs et activités pour les collégiens marocains.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">Les niveaux</h2>
        {levels && levels.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {levels.map((level, i) => (
              <LevelCard key={level.id} level={level} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Aucun niveau disponible pour le moment.</p>
        )}
      </section>
    </div>
  );
}
