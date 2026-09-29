import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <CourseBreadcrumb segments={[{ label: level.name }]} />
      <div>
        <h1 className="text-2xl font-semibold">{level.name}</h1>
        {level.description ? (
          <p className="mt-1 text-muted-foreground">{level.description}</p>
        ) : null}
      </div>
      <p className="text-muted-foreground">Aucune unité disponible pour le moment.</p>
    </div>
  );
}
