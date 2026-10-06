import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Pastel accents cycled across level cards — each level gets its own
// identity, order_index drives the assignment so it's stable.
const LEVEL_ACCENTS = [
  { bg: "bg-blue-50", ring: "ring-blue-200", icon: "text-blue-600", chip: "bg-blue-100 text-blue-700" },
  { bg: "bg-emerald-50", ring: "ring-emerald-200", icon: "text-emerald-600", chip: "bg-emerald-100 text-emerald-700" },
  { bg: "bg-amber-50", ring: "ring-amber-200", icon: "text-amber-700", chip: "bg-amber-100 text-amber-800" },
  { bg: "bg-fuchsia-50", ring: "ring-fuchsia-200", icon: "text-fuchsia-600", chip: "bg-fuchsia-100 text-fuchsia-700" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name")
    .order("order_index");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 size-72 rounded-full bg-white blur-3xl" />
          <div className="absolute right-10 bottom-10 size-96 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5" />
            Apprends l&apos;informatique autrement
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Cours, exercices et examens
            <span className="block text-gold">dans un seul endroit.</span>
          </h1>
          <p className="max-w-xl text-base text-primary-foreground/85 sm:text-lg">
            Révise à ton rythme, teste tes connaissances et passe tes examens — tout est pensé pour toi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Voir les cours
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/15"
            >
              Accéder à un examen
            </Link>
          </div>
        </div>
      </section>

      {/* Levels grid */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Choisis ton niveau</h2>
            <p className="mt-1 text-sm text-muted-foreground">Accède directement aux cours de ton année.</p>
          </div>
        </div>

        {levels && levels.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((lvl, i) => {
              const accent = LEVEL_ACCENTS[i % LEVEL_ACCENTS.length];
              return (
                <Link
                  key={lvl.id}
                  href={`/courses/${lvl.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full ${accent.bg}`} />
                  <div className="relative">
                    <div className={`flex size-12 items-center justify-center rounded-xl ring-1 ring-inset ${accent.bg} ${accent.ring}`}>
                      <GraduationCap className={`size-6 ${accent.icon}`} />
                    </div>
                    <h3 className="mt-5 text-xl font-bold">{lvl.name}</h3>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Commencer
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
            Les niveaux apparaîtront ici dès que ton enseignant les aura publiés.
          </p>
        )}
      </section>

      {/* Quick link */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-4">
          <QuickCard href="/exam" icon={BookOpen} title="Examens" desc="Passe l&apos;examen avec le code de ton enseignant." />
        </div>
      </section>
    </>
  );
}

function QuickCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof BookOpen;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
