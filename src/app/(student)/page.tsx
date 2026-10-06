import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const supabase = await createClient();
  const [settings, { data: levels }] = await Promise.all([
    getSettings(),
    supabase.from("levels").select("id, name").order("order_index"),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* Titre */}
      <section className="pb-14 pt-20 sm:pb-20 sm:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {settings.institution}
        </p>
        <h1 className="mt-4 text-6xl font-bold leading-none tracking-tighter sm:text-8xl">
          Informatique<span className="text-gold">.</span>
        </h1>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cours
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/exam"
            className="inline-flex items-center rounded-full border border-foreground/15 px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Examen
          </Link>
        </div>
      </section>

      {/* Niveaux — lignes pleine largeur, le survol remplit la ligne */}
      <section className="pb-24">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Niveaux
        </p>
        {levels && levels.length > 0 ? (
          <div className="border-t border-border">
            {levels.map((lvl, i) => (
              <Link
                key={lvl.id}
                href={`/courses/${lvl.id}`}
                className="group -mx-4 flex items-center gap-5 border-b border-border px-4 py-6 transition-colors hover:bg-primary hover:text-primary-foreground sm:gap-8"
              >
                <span className="font-mono text-sm text-muted-foreground transition-colors group-hover:text-primary-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-3xl font-bold tracking-tight sm:text-4xl">
                  {lvl.name}
                </span>
                <ArrowRight className="size-6 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="border-y border-border py-10 text-sm text-muted-foreground">
            Aucun niveau publié pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}
