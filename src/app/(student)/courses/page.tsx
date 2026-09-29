import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LevelCard } from "@/components/courses/level-card";

export const metadata: Metadata = {
  title: "Cours — Plateforme Informatique",
};

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name, description")
    .eq("is_active", true)
    .order("order_index");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Cours</h1>
      {levels && levels.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {levels.map((level) => (
            <LevelCard key={level.id} level={level} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucun niveau disponible pour le moment.</p>
      )}
    </div>
  );
}
