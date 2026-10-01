import { GraduationCap } from "lucide-react";
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
    <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:py-20">
      <section className="space-y-5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary uppercase">
          <GraduationCap className="size-3.5" />
          Collège · Informatique
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Apprendre l&apos;informatique, <span className="text-primary">simplement</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
          Cours, exercices interactifs et activités pour les collégiens marocains.
        </p>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold">Les niveaux</h2>
          <span className="mx-auto mt-2 block h-1 w-14 rounded-full bg-gold" />
        </div>
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
