import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Sparkles,
  KeyRound,
  BookOpen,
  Puzzle,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FloatingIcons } from "@/components/student/floating-icons";

const LEVEL_ACCENTS = [
  { tile: "bg-primary", ring: "border-primary/25 hover:border-primary", arrow: "text-primary", edge: "var(--primary-deep)" },
  { tile: "bg-teal-600", ring: "border-teal-600/25 hover:border-teal-600", arrow: "text-teal-600", edge: "oklch(0.42 0.09 185)" },
  { tile: "bg-violet-600", ring: "border-violet-600/25 hover:border-violet-600", arrow: "text-violet-600", edge: "oklch(0.42 0.2 293)" },
  { tile: "bg-rose-600", ring: "border-rose-600/25 hover:border-rose-600", arrow: "text-rose-600", edge: "oklch(0.45 0.2 16)" },
];

const FEATURES = [
  {
    icon: BookOpen,
    tile: "bg-primary",
    title: "Des cours clairs",
    text: "Chaque séance avec ses textes, images et vidéos.",
  },
  {
    icon: Puzzle,
    tile: "bg-teal-600",
    title: "Des activités à jouer",
    text: "Exercices et activités interactives, corrigés tout de suite.",
  },
  {
    icon: Trophy,
    tile: "bg-amber-500",
    title: "Des examens en ligne",
    text: "Un code, ton nom, et c'est parti. Ta note s'affiche à la fin.",
  },
];

const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent) 1.5px, transparent 1.5px)",
  backgroundSize: "26px 26px",
  maskImage: "radial-gradient(ellipse 85% 75% at 50% 30%, #000 30%, transparent 85%)",
  WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 30%, #000 30%, transparent 85%)",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name")
    .order("order_index");

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-20" style={GRID_STYLE} />
        <FloatingIcons dim layout="split" />

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
            {/* ── Left : hero ── */}
            <div>
              <span
                className="anim-pop inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary"
                style={{ "--i": 0 } as React.CSSProperties}
              >
                <Sparkles className="size-4" />
                Informatique — Collège
              </span>

              <h1
                className="anim-pop mt-6 text-balance font-heading text-[2.6rem] font-bold leading-[1.08] sm:text-6xl"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Apprendre{" "}
                <span className="text-primary">l&apos;informatique</span>,{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">pas à pas.</span>
                  <svg
                    aria-hidden
                    viewBox="0 0 240 14"
                    preserveAspectRatio="none"
                    className="absolute inset-x-0 bottom-[-0.12em] h-[0.3em] w-full text-amber-400"
                  >
                    <path
                      d="M3 9.5C45 4 92 3 122 5.5c30 2.5 76 4 115 1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p
                className="anim-pop mt-6 max-w-md text-pretty text-lg font-semibold leading-relaxed text-muted-foreground"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                Tes cours de l&apos;année, tes activités et tes examens, au même
                endroit. Révise à ton rythme&nbsp;!
              </p>

              <div
                className="anim-pop mt-9 flex flex-wrap gap-4"
                style={{ "--i": 3 } as React.CSSProperties}
              >
                <Link
                  href="/courses"
                  className="btn-chunky group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-extrabold text-white"
                >
                  <BookOpen className="size-5" strokeWidth={2.5} />
                  Voir les cours
                  <ArrowRight className="group-hover-nudge size-5" strokeWidth={2.5} />
                </Link>
                <Link
                  href="/exam"
                  className="btn-chunky group inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-base font-extrabold text-amber-950"
                  style={{ "--chunky-edge": "oklch(0.62 0.15 60)" } as React.CSSProperties}
                >
                  <KeyRound className="group-hover-wiggle size-5" strokeWidth={2.5} />
                  J&apos;ai un code d&apos;examen
                </Link>
              </div>
            </div>

            {/* ── Right : level picker ── */}
            <div
              className="anim-pop rounded-3xl border-2 border-border bg-card p-6 shadow-[0_6px_0_0_var(--border)]"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-10 rotate-6 items-center justify-center rounded-xl bg-primary text-white">
                  <GraduationCap className="size-5" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-heading text-xl font-bold leading-tight">Choisis ton niveau</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Et commence ta première séance
                  </p>
                </div>
              </div>

              {levels && levels.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {levels.map((lvl, i) => {
                    const a = LEVEL_ACCENTS[i % LEVEL_ACCENTS.length];
                    return (
                      <Link
                        key={lvl.id}
                        href={`/courses/${lvl.id}`}
                        className={`group flex items-center gap-4 rounded-2xl border-2 ${a.ring} bg-card px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5`}
                      >
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${a.tile} font-heading text-lg font-bold text-white`}
                          style={{ boxShadow: `0 3px 0 0 ${a.edge}` }}
                        >
                          {lvl.name.match(/\d/)?.[0] ?? <GraduationCap className="size-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-heading text-lg font-bold leading-tight">{lvl.name}</p>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Unités · Séquences · Séances
                          </p>
                        </div>
                        <ArrowRight
                          className={`group-hover-nudge size-5 shrink-0 ${a.arrow}`}
                          strokeWidth={2.5}
                        />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                  Les niveaux apparaîtront ici dès qu&apos;ils seront publiés.
                </p>
              )}

              <Link
                href="/exam"
                className="group mt-4 flex items-center gap-4 rounded-2xl border-2 border-amber-400/50 bg-amber-50 px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400"
              >
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950"
                  style={{ boxShadow: "0 3px 0 0 oklch(0.62 0.15 60)" }}
                >
                  <KeyRound className="group-hover-wiggle size-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="font-heading text-lg font-bold leading-tight text-amber-950">
                    Code d&apos;examen
                  </p>
                  <p className="text-xs font-semibold text-amber-800/80">J&apos;ai un code secret</p>
                </div>
                <ArrowRight className="group-hover-nudge size-5 shrink-0 text-amber-600" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you'll find here ── */}
      <section className="border-t-2 border-border bg-muted/40">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 py-14 sm:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="anim-pop group rounded-3xl border-2 border-border bg-card p-6 transition-transform duration-200 hover:-translate-y-1"
                style={{ "--i": i + 5 } as React.CSSProperties}
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-2xl ${f.tile} text-white`}
                >
                  <Icon className="group-hover-wiggle size-6" strokeWidth={2.5} />
                </div>
                <h2 className="mt-4 font-heading text-xl font-bold">{f.title}</h2>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
