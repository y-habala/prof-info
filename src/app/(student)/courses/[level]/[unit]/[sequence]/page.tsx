import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";
import { SessionCard } from "@/components/courses/session-card";

export default async function SequencePage({
  params,
}: {
  params: Promise<{ level: string; unit: string; sequence: string }>;
}) {
  const { level: levelId, unit: unitId, sequence: sequenceId } = await params;
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
    .select("id, title")
    .eq("id", unitId)
    .eq("level_id", level.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!unit) {
    notFound();
  }

  const { data: sequence } = await supabase
    .from("sequences")
    .select("id, title, description")
    .eq("id", sequenceId)
    .eq("unit_id", unit.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!sequence) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, description, duration_minutes")
    .eq("sequence_id", sequence.id)
    .eq("is_published", true)
    .order("order_index");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <CourseBreadcrumb
        segments={[
          { label: level.name, href: `/courses/${level.id}` },
          { label: unit.title, href: `/courses/${level.id}/${unit.id}` },
          { label: sequence.title },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{sequence.title}</h1>
        {sequence.description ? (
          <p className="mt-1 text-muted-foreground">{sequence.description}</p>
        ) : null}
      </div>
      {sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              levelId={level.id}
              unitId={unit.id}
              sequenceId={sequence.id}
              session={session}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucune séance disponible pour le moment.</p>
      )}
    </div>
  );
}
