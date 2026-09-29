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
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Bienvenue sur notre plateforme informatique</h1>
        <p className="text-muted-foreground">Apprendre l&apos;informatique simplement</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Les niveaux</h2>
        {levels && levels.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {levels.map((level) => (
              <LevelCard key={level.id} level={level} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun niveau disponible pour le moment.</p>
        )}
      </section>
    </div>
  );
}
