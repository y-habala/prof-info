import { notFound } from "next/navigation";
import Link from "next/link";
import { Folder, ListOrdered, PlayCircle, Clock, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";

type SessionRow = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_published: boolean;
};

type SequenceRow = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  sessions: SessionRow[] | null;
};

type UnitRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  sequences: SequenceRow[] | null;
};

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

  // One fetch for the whole Unité → Séquence → Séance tree — publication
  // filtering/ordering for the nested tables happens in JS below rather
  // than via PostgREST's embedded-filter syntax, matching how this
  // codebase already does any non-trivial grouping (see the devoirs
  // report page) rather than leaning on a fussier query-string approach.
  const { data: unitsData } = await supabase
    .from("units")
    .select(
      "id, title, description, image_url, sequences(id, title, description, order_index, is_published, sessions(id, title, description, duration_minutes, order_index, is_published))"
    )
    .eq("level_id", level.id)
    .eq("is_published", true)
    .order("order_index");

  const units = ((unitsData as unknown as UnitRow[] | null) ?? []).map((unit) => ({
    ...unit,
    sequences: (unit.sequences ?? [])
      .filter((sq) => sq.is_published)
      .sort((a, b) => a.order_index - b.order_index)
      .map((sq) => ({
        ...sq,
        sessions: (sq.sessions ?? []).filter((se) => se.is_published).sort((a, b) => a.order_index - b.order_index),
      }))
      .filter((sq) => sq.sessions.length > 0),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <CourseBreadcrumb segments={[{ label: level.name }]} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{level.name}</h1>
        {level.description ? <p className="mt-1 text-muted-foreground">{level.description}</p> : null}
      </div>

      {units.length > 0 ? (
        <div className="space-y-4">
          {units.map((unit, index) => (
            <details
              key={unit.id}
              open={index === 0}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 select-none hover:bg-muted/40">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Folder className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{unit.title}</h2>
                  {unit.description ? (
                    <p className="truncate text-sm text-muted-foreground">{unit.description}</p>
                  ) : null}
                </div>
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-5 border-t border-border px-4 pt-4 pb-5">
                {unit.sequences.length > 0 ? (
                  unit.sequences.map((sequence) => (
                    <div key={sequence.id} className="space-y-2">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                        <ListOrdered className="size-3.5" />
                        {sequence.title}
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sequence.sessions.map((session) => (
                          <Link
                            key={session.id}
                            href={`/courses/${level.id}/${unit.id}/${sequence.id}/${session.id}`}
                            className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
                          >
                            <PlayCircle className="size-4 shrink-0 text-primary/70" />
                            <span className="min-w-0 flex-1 truncate font-medium">{session.title}</span>
                            {session.duration_minutes ? (
                              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                {session.duration_minutes} min
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Contenu à venir.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucune unité disponible pour le moment.</p>
      )}
    </div>
  );
}
