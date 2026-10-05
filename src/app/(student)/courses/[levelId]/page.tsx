import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, ListOrdered, PlayCircle, Clock, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type SessionRow = { id: string; title: string; duration_minutes: number | null; order_index: number; is_published: boolean };
type SequenceRow = { id: string; title: string; order_index: number; is_published: boolean; sessions: SessionRow[] | null };
type UnitRow = { id: string; title: string; order_index: number; is_published: boolean; sequences: SequenceRow[] | null };

export default async function LevelPage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  const supabase = await createClient();

  const { data: level } = await supabase
    .from("levels")
    .select("id, name")
    .eq("id", levelId)
    .eq("is_active", true)
    .maybeSingle();

  if (!level) notFound();

  // One nested fetch for the whole tree. Published filtering + ordering done
  // in JS afterward — matches v1's approved pattern.
  const { data: unitsData } = await supabase
    .from("units")
    .select("id, title, order_index, is_published, sequences(id, title, order_index, is_published, sessions(id, title, duration_minutes, order_index, is_published))")
    .eq("level_id", level.id)
    .eq("is_published", true)
    .order("order_index");

  const units = ((unitsData as unknown as UnitRow[] | null) ?? []).map((u) => ({
    ...u,
    sequences: (u.sequences ?? [])
      .filter((s) => s.is_published)
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => ({
        ...s,
        sessions: (s.sessions ?? [])
          .filter((se) => se.is_published)
          .sort((a, b) => a.order_index - b.order_index),
      }))
      .filter((s) => s.sessions.length > 0),
  })).filter((u) => u.sequences.length > 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Tous les niveaux
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{level.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique sur une unité pour la développer, puis sur une séance pour l&apos;ouvrir.
        </p>
      </div>

      {units.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Aucun contenu publié pour ce niveau pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {units.map((unit, index) => (
            <details
              key={unit.id}
              open={index === 0}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 select-none hover:bg-muted/30">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Folder className="size-5" />
                </span>
                <h2 className="min-w-0 flex-1 truncate font-semibold">{unit.title}</h2>
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-5 border-t border-border p-5">
                {unit.sequences.map((seq) => (
                  <div key={seq.id} className="space-y-2.5">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <ListOrdered className="size-3.5" />
                      {seq.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {seq.sessions.map((session) => (
                        <Link
                          key={session.id}
                          href={`/courses/${level.id}/${unit.id}/${seq.id}/${session.id}`}
                          className="group/sess flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                        >
                          <PlayCircle className="size-4 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate font-medium">{session.title}</span>
                          {session.duration_minutes ? (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              {session.duration_minutes}&apos;
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
