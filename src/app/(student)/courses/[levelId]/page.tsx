import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ChevronDown, GraduationCap, Layers, PlayCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageBanner } from "@/components/student/page-banner";

// Each unit gets its own solid colour — visible at a glance so a student
// always knows which unit they're reading without re-reading the title.
const UNIT_ACCENTS = [
  { header: "bg-primary", edge: "var(--primary-deep)", hover: "hover:border-primary hover:text-primary", icon: "text-primary" },
  { header: "bg-teal-600", edge: "oklch(0.42 0.09 185)", hover: "hover:border-teal-600 hover:text-teal-700", icon: "text-teal-600" },
  { header: "bg-violet-600", edge: "oklch(0.42 0.2 293)", hover: "hover:border-violet-600 hover:text-violet-700", icon: "text-violet-600" },
  { header: "bg-rose-600", edge: "oklch(0.45 0.2 16)", hover: "hover:border-rose-600 hover:text-rose-700", icon: "text-rose-600" },
  { header: "bg-amber-500", edge: "oklch(0.58 0.14 60)", hover: "hover:border-amber-500 hover:text-amber-700", icon: "text-amber-600" },
];

// Each séquence inside a unit gets its own badge colour + tinted panel.
const SEQ_ACCENTS = [
  { bg: "bg-primary/6", border: "border-primary/20", badge: "bg-primary text-white" },
  { bg: "bg-teal-500/8", border: "border-teal-500/25", badge: "bg-teal-600 text-white" },
  { bg: "bg-amber-500/8", border: "border-amber-500/25", badge: "bg-amber-500 text-white" },
  { bg: "bg-violet-500/8", border: "border-violet-500/25", badge: "bg-violet-600 text-white" },
  { bg: "bg-rose-500/8", border: "border-rose-500/25", badge: "bg-rose-600 text-white" },
];

type SessionRow = { id: string; title: string; duration_minutes: number | null; order_index: number; is_published: boolean };
type SequenceRow = { id: string; title: string; order_index: number; is_published: boolean; sessions: SessionRow[] | null };
type UnitRow = { id: string; title: string; order_index: number; is_published: boolean; sequences: SequenceRow[] | null };
type LooseSessionRow = SessionRow & { unit_id: string };
type UnitAccent = (typeof UNIT_ACCENTS)[number];

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

  // Séances that belong to the unit itself, with no séquence.
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

  const sessionCount = units.reduce(
    (n, u) => n + u.sessions.length + u.sequences.reduce((m, s) => m + s.sessions.length, 0),
    0
  );

  return (
    <>
      <PageBanner
        title={level.name}
        icon={GraduationCap}
        back={{ href: "/courses", label: "Tous les niveaux" }}
        subtitle="Ouvre une unité, puis clique sur une séance pour commencer."
      >
        {units.length > 0 ? (
          <div className="anim-pop mt-6 flex flex-wrap gap-2.5" style={{ "--i": 3 } as React.CSSProperties}>
            <Stat icon={Layers} label={`${units.length} unité${units.length > 1 ? "s" : ""}`} />
            <Stat icon={PlayCircle} label={`${sessionCount} séance${sessionCount > 1 ? "s" : ""}`} />
          </div>
        ) : null}
      </PageBanner>

      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        {units.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-border p-10 text-center font-semibold text-muted-foreground">
            Aucun contenu publié pour ce niveau pour le moment.
          </p>
        ) : (
          <div className="space-y-5">
            {units.map((unit, ui) => {
              const ua = UNIT_ACCENTS[ui % UNIT_ACCENTS.length];
              return (
                <details
                  key={unit.id}
                  open={ui === 0}
                  className="anim-pop group overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[0_6px_0_0_var(--border)]"
                  style={{ "--i": ui } as React.CSSProperties}
                >
                  <summary
                    className={`flex cursor-pointer list-none items-center gap-4 px-5 py-4 select-none ${ua.header} text-white transition-[filter] hover:brightness-110`}
                  >
                    <span
                      className="flex size-12 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white font-heading text-2xl font-bold transition-transform duration-300 group-open:rotate-0"
                      style={{ boxShadow: `0 4px 0 0 ${ua.edge}` }}
                    >
                      <span className={ua.icon}>{ui + 1}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/80">
                        Unité {ui + 1}
                      </p>
                      <h2 className="text-balance font-heading text-lg font-bold leading-snug sm:text-xl">
                        {unit.title}
                      </h2>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-open:rotate-180">
                      <ChevronDown className="size-5" strokeWidth={2.75} />
                    </span>
                  </summary>

                  <div className="space-y-4 p-4 sm:p-5">
                    {unit.sessions.length > 0 && (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {unit.sessions.map((session) => (
                          <SessionLink
                            key={session.id}
                            href={`/courses/${level.id}/${unit.id}/-/${session.id}`}
                            session={session}
                            accent={ua}
                          />
                        ))}
                      </div>
                    )}

                    {unit.sequences.map((seq, si) => {
                      const a = SEQ_ACCENTS[si % SEQ_ACCENTS.length];
                      return (
                        <div key={seq.id} className={`rounded-2xl border-2 ${a.border} ${a.bg} p-4`}>
                          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-extrabold ${a.badge}`}
                            >
                              Séquence {si + 1}
                            </span>
                            <h3 className="min-w-0 font-heading text-base font-bold">{seq.title}</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {seq.sessions.map((session) => (
                              <SessionLink
                                key={session.id}
                                href={`/courses/${level.id}/${unit.id}/${seq.id}/${session.id}`}
                                session={session}
                                accent={ua}
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
    </>
  );
}

function Stat({ icon: Icon, label }: { icon: typeof Layers; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-extrabold text-primary">
      <Icon className="size-4" strokeWidth={2.5} />
      {label}
    </span>
  );
}

function SessionLink({
  href,
  session,
  accent,
}: {
  href: string;
  session: SessionRow;
  accent: UnitAccent;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-3 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${accent.hover}`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${accent.header} text-white transition-transform duration-200 group-hover:scale-110`}
      >
        <PlayCircle className="size-4" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground">{session.title}</span>
      {session.duration_minutes ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Clock className="size-3.5" />
          {session.duration_minutes}&apos;
        </span>
      ) : null}
      <ArrowRight className={`group-hover-nudge size-4 shrink-0 ${accent.icon}`} strokeWidth={2.5} />
    </Link>
  );
}
