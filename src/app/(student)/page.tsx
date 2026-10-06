import Link from "next/link";
import { ArrowRight, GraduationCap, Layers, ShieldCheck, Sparkles } from "lucide-react";
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

// Fine graph-paper grid behind the hero, faded out towards the bottom.
// Inline because the mask + the border token can't be expressed as utilities.
const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: "64px 64px",
  maskImage: "radial-gradient(ellipse 75% 70% at 50% 0%, #000 35%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 0%, #000 35%, transparent 100%)",
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
        <div aria-hidden className="absolute inset-0 -z-10 opacity-70" style={GRID_STYLE} />

        <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-gold" />
            Informatique — Enseignement secondaire collégial
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Apprendre l&apos;informatique,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">pas à pas.</span>
              {/* Hand-drawn underline — the one playful stroke on the page */}
              <svg
                aria-hidden
                viewBox="0 0 240 14"
                preserveAspectRatio="none"
                className="absolute inset-x-0 -bottom-1 h-3 w-full text-gold"
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

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Les cours de l&apos;année, organisés par niveau, unité et séance — et les
            examens, au même endroit. Révise à ton rythme.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Voir les cours
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              J&apos;ai un code d&apos;examen
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trois repères ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Feature
            icon={Layers}
            title="Un programme clair"
            desc="Unités, séquences et séances dans l'ordre du cours."
          />
          <Feature
            icon={GraduationCap}
            title="À ton rythme"
            desc="Relis une séance autant de fois que nécessaire."
          />
          <Feature
            icon={ShieldCheck}
            title="Examens encadrés"
            desc="Accès par code remis en classe par l'enseignant."
          />
        </div>
      </section>

      {/* ── Niveaux ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Niveaux
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Choisis ton niveau
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Chaque niveau regroupe l&apos;ensemble des séances publiées pour l&apos;année.
        </p>

        {levels && levels.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((lvl, i) => {
              const accent = LEVEL_ACCENTS[i % LEVEL_ACCENTS.length];
              return (
                <Link
                  key={lvl.id}
                  href={`/courses/${lvl.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-foreground/15 hover:shadow-lg"
                >
                  <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl text-white ${accent}`}
                    >
                      <GraduationCap className="size-5" strokeWidth={2.25} />
                    </div>
                    <span
                      aria-hidden
                      className="select-none text-4xl font-black leading-none tabular-nums text-foreground/[0.07]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{lvl.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Unités, séquences et séances.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Commencer
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            Les niveaux apparaîtront ici dès que ton enseignant les aura publiés.
          </p>
        )}
      </section>

      {/* ── Bandeau examen ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-[24px] border-white/10"
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold tracking-tight">Tu passes un examen ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
                Saisis le code à 4 chiffres remis par ton enseignant, puis tes
                informations pour commencer.
              </p>
            </div>
            <Link
              href="/exam"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Accéder à l&apos;examen
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Layers;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 px-0 py-6 sm:px-6">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2.25} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
