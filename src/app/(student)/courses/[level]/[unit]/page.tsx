import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ level: string; unit: string }>;
}) {
  const { level: levelId, unit: unitId } = await params;
  const supabase = await createClient();

  const { data: level } = await supabase
    .from("levels")
    .select("id, name")
    .eq("id", levelId)
    .eq("is_active", true)
    .maybeSingle();

  if (!level) {
    notFound();
  }

  const { data: unit } = await supabase
    .from("units")
    .select("id, title, description")
    .eq("id", unitId)
    .eq("level_id", level.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!unit) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <CourseBreadcrumb
        segments={[{ label: level.name, href: `/courses/${level.id}` }, { label: unit.title }]}
      />
      <div>
        <h1 className="text-2xl font-semibold">{unit.title}</h1>
        {unit.description ? (
          <p className="mt-1 text-muted-foreground">{unit.description}</p>
        ) : null}
      </div>
      <p className="text-muted-foreground">Aucune séquence disponible pour le moment.</p>
    </div>
  );
}
