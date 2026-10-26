import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles, BookOpen, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const LEVEL_ACCENTS = [
  { bg: "bg-primary", text: "text-primary", border: "border-primary/20", light: "bg-primary/8" },
  { bg: "bg-teal-600", text: "text-teal-600", border: "border-teal-600/20", light: "bg-teal-600/8" },
  { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-500/20", light: "bg-amber-500/8" },
  { bg: "bg-violet-600", text: "text-violet-600", border: "border-violet-600/20", light: "bg-violet-600/8" },
];

const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: "88px 88px",
  maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 20%, transparent 80%)",
  WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 20%, transparent 80%)",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name")
    .order("order_index");

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 opacity-50" style={GRID_STYLE} />

      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_380px] lg:gap-20">

          {/* ── Left : hero ─────────────────────────────────────────── */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="size-3.5 text-gold" />
              Informatique — Enseignement secondaire collégial
            </span>

            <h1 className="mt-7 text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Apprendre<br />
              l&apos;informatique,{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">pas à pas.</span>
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

            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Les cours de l&apos;année, organisés par niveau, unité et séance — et les
              examens, au même endroit. Révise à ton rythme.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                Voir tous les cours
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

          {/* ── Right : level picker ─────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="size-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Cours
                </p>
                <p className="text-sm font-semibold leading-tight">Choisis ton niveau</p>
              </div>
            </div>

            {levels && levels.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {levels.map((lvl, i) => {
                  const a = LEVEL_ACCENTS[i % LEVEL_ACCENTS.length];
                  return (
                    <Link
                      key={lvl.id}
                      href={`/courses/${lvl.id}`}
                      className={`group flex items-center gap-4 rounded-xl border ${a.border} ${a.light} px-4 py-3.5 transition-all duration-200 hover:-translate-y-px hover:shadow-sm`}
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${a.bg} text-white`}
                      >
                        <GraduationCap className="size-4" strokeWidth={2.25} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{lvl.name}</p>
                        <p className="text-xs text-muted-foreground">Unités · Séances</p>
                      </div>
                      <ArrowRight
                        className={`size-4 shrink-0 ${a.text} transition-transform duration-200 group-hover:translate-x-0.5`}
                      />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
                Les niveaux apparaîtront ici dès qu&apos;ils seront publiés.
              </p>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <Link
                href="/exam"
                className="group flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3.5 transition-all duration-200 hover:-translate-y-px hover:border-amber-400/60 hover:shadow-sm dark:bg-amber-950/20 dark:border-amber-400/20"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <KeyRound className="size-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Code d&apos;examen</p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70">J&apos;ai un code secret</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-amber-600 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
