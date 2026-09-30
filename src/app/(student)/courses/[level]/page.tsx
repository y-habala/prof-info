import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";
import { UnitCard } from "@/components/courses/unit-card";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: levelId } = await params;
  const supabase = await createClient();
  const { data: level } = await supabase
    .from("levels")
    .select("id, name, description")
    .eq("id", levelId)
    .eq("is_active", true)
    .maybeSingle();

  if (!level) {
    notFound();
  }

  const { data: units } = await supabase
    .from("units")
    .select("id, title, description, image_url")
    .eq("level_id", level.id)
    .eq("is_published", true)
    .order("order_index");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <CourseBreadcrumb segments={[{ label: level.name }]} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{level.name}</h1>
        {level.description ? (
          <p className="mt-1 text-muted-foreground">{level.description}</p>
        ) : null}
      </div>
      {units && units.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {units.map((unit) => (
            <UnitCard key={unit.id} levelId={level.id} unit={unit} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucune unité disponible pour le moment.</p>
      )}
    </div>
  );
}
