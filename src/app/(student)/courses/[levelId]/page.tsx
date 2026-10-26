import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, ListOrdered, PlayCircle, Clock, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const UNIT_ACCENTS = [
  { iconBg: "bg-primary",     topBar: "before:bg-primary"     },
  { iconBg: "bg-teal-600",    topBar: "before:bg-teal-600"    },
  { iconBg: "bg-violet-600",  topBar: "before:bg-violet-600"  },
  { iconBg: "bg-rose-600",    topBar: "before:bg-rose-600"    },
  { iconBg: "bg-amber-500",   topBar: "before:bg-amber-500"   },
];

const SEQ_ACCENTS = [
  { border: "border-l-primary",    bg: "bg-primary/5",    title: "text-primary",    icon: "text-primary"    },
  { border: "border-l-teal-500",   bg: "bg-teal-500/5",   title: "text-teal-700",   icon: "text-teal-500"   },
  { border: "border-l-amber-500",  bg: "bg-amber-500/5",  title: "text-amber-700",  icon: "text-amber-500"  },
  { border: "border-l-violet-500", bg: "bg-violet-500/5", title: "text-violet-700", icon: "text-violet-500" },
  { border: "border-l-rose-500",   bg: "bg-rose-500/5",   title: "text-rose-700",   icon: "text-rose-500"   },
];

type SessionRow = { id: string; title: string; duration_minutes: number | null; order_index: number; is_published: boolean };
type SequenceRow = { id: string; title: string; order_index: number; is_published: boolean; sessions: SessionRow[] | null };
type UnitRow = { id: string; title: string; order_index: number; is_published: boolean; sequences: SequenceRow[] | null };
type LooseSessionRow = SessionRow & { unit_id: string };

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

  const rawUnits = (unitsData as unknown as UnitRow[] | null) ?? [];

  // Séances that belong to the unit itself, with no séquence. Fetched apart
  // from the tree above: sessions now reach a unit both directly and through
  // a séquence, and a separate query keeps which one is meant unambiguous.
  const unitIds = rawUnits.map((u) => u.id);
  const { data: looseData } = unitIds.length
    ? await supabase
        .from("sessions")
        .select("id, title, duration_minutes, order_index, is_published, unit_id")
        .in("unit_id", unitIds)
        .is("sequence_id", null)
        .eq("is_published", true)
    : { data: [] };

  const looseByUnit = new Map<string, SessionRow[]>();
  for (const row of (looseData ?? []) as LooseSessionRow[]) {
    const list = looseByUnit.get(row.unit_id) ?? [];
    list.push(row);
    looseByUnit.set(row.unit_id, list);
  }

  const units = rawUnits
    .map((u) => ({
      ...u,
      sessions: (looseByUnit.get(u.id) ?? []).sort((a, b) => a.order_index - b.order_index),
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
    }))
    .filter((u) => u.sessions.length > 0 || u.sequences.length > 0);

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
          {units.map((unit, index) => {
            const ua = UNIT_ACCENTS[index % UNIT_ACCENTS.length];
            return (
            <details
              key={unit.id}
              open={index === 0}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow open:shadow-sm"
            >
              {/* Coloured top bar */}
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${ua.iconBg}`} />
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 pt-5 select-none hover:bg-muted/30">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${ua.iconBg} text-white`}>
                  <Folder className="size-5" />
                </span>
                <h2 className="min-w-0 flex-1 truncate font-semibold">{unit.title}</h2>
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-5 border-t border-border p-5">
                {unit.sessions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {unit.sessions.map((session) => (
                      <SessionLink
                        key={session.id}
                        href={`/courses/${level.id}/${unit.id}/-/${session.id}`}
                        session={session}
                      />
                    ))}
                  </div>
                ) : null}
                {unit.sequences.map((seq, si) => {
                  const a = SEQ_ACCENTS[si % SEQ_ACCENTS.length];
                  return (
                    <div
                      key={seq.id}
                      className={`space-y-2.5 rounded-xl border-l-4 ${a.border} ${a.bg} p-4`}
                    >
                      <h3 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${a.title}`}>
                        <ListOrdered className={`size-3.5 ${a.icon}`} />
                        {seq.title}
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {seq.sessions.map((session) => (
                          <SessionLink
                            key={session.id}
                            href={`/courses/${level.id}/${unit.id}/${seq.id}/${session.id}`}
                            session={session}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessionLink({ href, session }: { href: string; session: SessionRow }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
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
  );
}
