import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Solid accents cycled across level cards — one saturated hue per level,
// used as a top bar + icon tile (never as a pastel wash). order_index drives
// the assignment so each level keeps its identity between visits.
const LEVEL_ACCENTS = [
  "bg-primary",
  "bg-teal-600",
  "bg-amber-500",
  "bg-violet-600",
];

// Graph-paper grid behind the hero. Wide cells and an early fade on purpose:
// it should read as paper texture under the headline, never as lines competing
// with it. Inline because the mask + the border token aren't expressible as
// utilities.
const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: "88px 88px",
  maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 10%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 10%, transparent 75%)",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name")
    .order("order_index");

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-60" style={GRID_STYLE} />

        <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-gold" />
            Informatique — Enseignement secondaire collégial
          </span>

          <h1 className="mt-7 text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-6xl">
            Apprendre l&apos;informatique,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">pas à pas.</span>
              {/* Hand-drawn underline — the one playful stroke on the page.
               * Offsets are in em so the stroke keeps the same distance from
               * the baseline at every breakpoint, and low enough to clear the
               * descender of the "p" instead of crossing it. */}
              <svg
                aria-hidden
                viewBox="0 0 240 14"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-[-0.13em] h-[0.26em] w-full text-gold"
              >
                <path
                  d="M3 9.5C45 4 92 3 122 5.5c30 2.5 76 4 115 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Les cours de l&apos;année, organisés par niveau, unité et séance — et les
            examens, au même endroit. Révise à ton rythme.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Voir les cours
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold transition-colors duration-200 hover:bg-muted"
            >
              J&apos;ai un code d&apos;examen
            </Link>
          </div>
        </div>
      </section>

      {/* ── Niveaux ──────────────────────────────────────────────────── */}
      {/* Header centred like the hero: the whole page reads down one axis
       * instead of jumping from centred to left-aligned mid-scroll. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Niveaux
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Choisis ton niveau
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            Chaque niveau regroupe l&apos;ensemble des séances publiées pour l&apos;année.
          </p>
        </div>

        {levels && levels.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((lvl, i) => {
              const accent = LEVEL_ACCENTS[i % LEVEL_ACCENTS.length];
              return (
                <Link
                  key={lvl.id}
                  href={`/courses/${lvl.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
                >
                  <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
                  {/* No decorative index here: the level name already starts
                   * with its number, and printing it twice crowded the card. */}
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl text-white ${accent}`}
                  >
                    <GraduationCap className="size-5" strokeWidth={2.25} />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{lvl.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Unités, séquences et séances.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Commencer
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-12 rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
            Les niveaux apparaîtront ici dès que ton enseignant les aura publiés.
          </p>
        )}
      </section>
    </>
  );
}
