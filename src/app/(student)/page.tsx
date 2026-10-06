import Link from "next/link";
import { ArrowRight, ArrowUpRight, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

type SessionRow = { id: string; title: string; created_at: string; is_published: boolean };
type SequenceRow = { id: string; is_published: boolean; sessions: SessionRow[] | null };
type UnitRow = { id: string; is_published: boolean; sequences: SequenceRow[] | null };
type LevelRow = { id: string; name: string; units: UnitRow[] | null };

/** "2025/2026" — the school year rolls over in September. */
function currentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() >= 8 ? y : y - 1;
  return `${start}/${start + 1}`;
}

const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

export default async function HomePage() {
  const supabase = await createClient();

  // One nested read covers both the per-level counts and the recent-sessions
  // list — the student landing page is the only place that needs either.
  const [settings, { data: levelsData }] = await Promise.all([
    getSettings(),
    supabase
      .from("levels")
      .select(
        "id, name, order_index, units(id, is_published, sequences(id, is_published, sessions(id, title, created_at, is_published)))"
      )
      .eq("is_active", true)
      .order("order_index"),
  ]);

  const rows = (levelsData as unknown as LevelRow[] | null) ?? [];

  const levels = rows.map((lvl) => {
    const units = (lvl.units ?? []).filter((u) => u.is_published);
    let sessionCount = 0;
    const sessions: { id: string; title: string; created_at: string; href: string }[] = [];
    for (const unit of units) {
      for (const seq of (unit.sequences ?? []).filter((s) => s.is_published)) {
        for (const se of (seq.sessions ?? []).filter((s) => s.is_published)) {
          sessionCount++;
          sessions.push({
            id: se.id,
            title: se.title,
            created_at: se.created_at,
            href: `/courses/${lvl.id}/${unit.id}/${seq.id}/${se.id}`,
          });
        }
      }
    }
    return { id: lvl.id, name: lvl.name, unitCount: units.length, sessionCount, sessions };
  });

  const recent = levels
    .flatMap((lvl) => lvl.sessions.map((s) => ({ ...s, levelName: lvl.name })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24">
      {/* En-tête */}
      <header className="flex flex-col gap-4 border-b border-border pb-10 pt-14 sm:flex-row sm:items-end sm:justify-between sm:pt-20">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Informatique</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enseignement secondaire collégial — {settings.institution}
          </p>
        </div>
        <p className="shrink-0 text-sm text-muted-foreground sm:text-right">
          Année scolaire{" "}
          <span className="font-semibold tabular-nums text-foreground">{currentSchoolYear()}</span>
        </p>
      </header>

      {/* Niveaux */}
      <section className="mt-14">
        <SectionLabel>Niveaux</SectionLabel>
        {levels.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {levels.map((lvl) => (
              <Link
                key={lvl.id}
                href={`/courses/${lvl.id}`}
                className="group rounded-xl border border-border p-5 transition-colors hover:border-foreground/25 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold tracking-tight">{lvl.name}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <p className="mt-4 text-xs tabular-nums text-muted-foreground">
                  {lvl.unitCount} {lvl.unitCount === 1 ? "unité" : "unités"} · {lvl.sessionCount}{" "}
                  {lvl.sessionCount === 1 ? "séance" : "séances"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Aucun niveau disponible.</p>
        )}
      </section>

      {/* Dernières séances — l'unique endroit où elles sont réunies tous
       * niveaux confondus ; ailleurs on navigue niveau par niveau. */}
      {recent.length > 0 ? (
        <section className="mt-14">
          <SectionLabel>Dernières séances</SectionLabel>
          <ul className="mt-2 divide-y divide-border">
            {recent.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  className="group flex items-baseline gap-4 py-3.5 transition-colors hover:text-primary"
                >
                  <span className="w-14 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.levelName}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {shortDate.format(new Date(s.created_at))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Examen */}
      <section className="mt-14">
        <SectionLabel>Examen</SectionLabel>
        <Link
          href="/exam"
          className="group mt-5 flex items-center gap-4 rounded-xl border border-border p-5 transition-colors hover:border-foreground/25 hover:bg-muted/40"
        >
          <KeyRound className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 text-sm">
            Saisis le code à 4 chiffres remis par ton enseignant.
          </span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
