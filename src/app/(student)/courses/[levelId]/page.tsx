import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlayCircle, Clock, ChevronDown, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Each unit gets its own solid color — visible at a glance so a student
// always knows which unit they're reading without re-reading the title.
const UNIT_ACCENTS = [
  { header: "bg-primary",    headerText: "text-white",         num: "bg-white/20 text-white" },
  { header: "bg-teal-600",   headerText: "text-white",         num: "bg-white/20 text-white" },
  { header: "bg-violet-600", headerText: "text-white",         num: "bg-white/20 text-white" },
  { header: "bg-rose-600",   headerText: "text-white",         num: "bg-white/20 text-white" },
  { header: "bg-amber-500",  headerText: "text-white",         num: "bg-white/20 text-white" },
];

// Each sequence inside a unit gets its own left-border accent.
const SEQ_ACCENTS = [
  { bar: "bg-primary",    bg: "bg-primary/6",    badge: "bg-primary text-white",        title: "text-foreground" },
  { bar: "bg-teal-500",   bg: "bg-teal-500/6",   badge: "bg-teal-600 text-white",       title: "text-foreground" },
  { bar: "bg-amber-500",  bg: "bg-amber-500/6",  badge: "bg-amber-500 text-white",      title: "text-foreground" },
  { bar: "bg-violet-500", bg: "bg-violet-500/6", badge: "bg-violet-600 text-white",     title: "text-foreground" },
  { bar: "bg-rose-500",   bg: "bg-rose-500/6",   badge: "bg-rose-600 text-white",       title: "text-foreground" },
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

  const { data: unitsData } = await supabase
    .from("units")
    .select("id, title, order_index, is_published, sequences(id, title, order_index, is_published, sessions(id, title, duration_minutes, order_index, is_published))")
    .eq("level_id", level.id)
    .eq("is_published", true)
    .order("order_index");

  const rawUnits = (unitsData as unknown as UnitRow[] | null) ?? [];

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
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-10">
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
        <div className="space-y-4">
          {units.map((unit, ui) => {
            const ua = UNIT_ACCENTS[ui % UNIT_ACCENTS.length];
            return (
              <details
                key={unit.id}
                open={ui === 0}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow open:shadow-md"
              >
                {/* ── Unit header — full coloured band ── */}
                <summary className={`flex cursor-pointer list-none items-center gap-4 px-5 py-4 select-none ${ua.header} transition-opacity hover:opacity-90`}>
                  {/* Number badge */}
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${ua.num}`}>
                    {ui + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${ua.headerText} opacity-75`}>
                      Unité {ui + 1}
                    </p>
                    <h2 className={`truncate text-base font-bold ${ua.headerText}`}>{unit.title}</h2>
                  </div>
                  <ChevronDown className={`size-5 shrink-0 ${ua.headerText} opacity-80 transition-transform group-open:rotate-180`} />
                </summary>

                {/* ── Content ── */}
                <div className="space-y-4 p-5">
                  {/* Sessions directly on the unit (no sequence) */}
                  {unit.sessions.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {unit.sessions.map((session) => (
                        <SessionLink
                          key={session.id}
                          href={`/courses/${level.id}/${unit.id}/-/${session.id}`}
                          session={session}
                        />
                      ))}
                    </div>
                  )}

                  {/* Sequences */}
                  {unit.sequences.map((seq, si) => {
                    const a = SEQ_ACCENTS[si % SEQ_ACCENTS.length];
                    return (
                      <div key={seq.id} className={`overflow-hidden rounded-xl ${a.bg}`}>
                        {/* Sequence header row */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${a.badge}`}>
                            Séquence {si + 1}
                          </span>
                          <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${a.title}`}>
                            {seq.title}
                          </span>
                        </div>
                        {/* Coloured bottom border to visually close the header */}
                        <div className={`mx-4 mb-3 h-px ${a.bar} opacity-20`} />
                        {/* Session links */}
                        <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
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
      className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
    >
      <BookOpen className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
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
