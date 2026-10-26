import Link from "next/link";
import { BookOpen, ArrowRight, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageBanner } from "@/components/student/page-banner";

const LEVEL_ACCENTS = [
  { tile: "bg-primary", text: "text-primary", ring: "hover:border-primary", edge: "var(--primary-deep)" },
  { tile: "bg-teal-600", text: "text-teal-600", ring: "hover:border-teal-600", edge: "oklch(0.42 0.09 185)" },
  { tile: "bg-violet-600", text: "text-violet-600", ring: "hover:border-violet-600", edge: "oklch(0.42 0.2 293)" },
  { tile: "bg-rose-600", text: "text-rose-600", ring: "hover:border-rose-600", edge: "oklch(0.45 0.2 16)" },
];

export default async function CoursesLandingPage() {
  const supabase = await createClient();
  const { data: levels } = await supabase.from("levels").select("id, name").order("order_index");

  return (
    <>
      <PageBanner
        title="Cours"
        icon={BookOpen}
        subtitle="Choisis ton niveau pour accéder aux unités, séquences et séances."
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        {levels && levels.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {levels.map((lvl, i) => {
              const a = LEVEL_ACCENTS[i % LEVEL_ACCENTS.length];
              return (
                <Link
                  key={lvl.id}
                  href={`/courses/${lvl.id}`}
                  className={`anim-pop group relative overflow-hidden rounded-3xl border-2 border-border bg-card p-6 shadow-[0_6px_0_0_var(--border)] transition-all duration-200 hover:-translate-y-1 ${a.ring}`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span
                    aria-hidden
                    className={`absolute -right-4 -top-6 font-heading text-[7rem] font-bold leading-none opacity-10 ${a.text}`}
                  >
                    {lvl.name.match(/\d/)?.[0] ?? ""}
                  </span>
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl ${a.tile} text-white`}
                    style={{ boxShadow: `0 4px 0 0 ${a.edge}` }}
                  >
                    <GraduationCap className="group-hover-wiggle size-7" strokeWidth={2.5} />
                  </div>
                  <p className="mt-5 font-heading text-2xl font-bold">{lvl.name}</p>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    Unités, séquences et séances
                  </p>
                  <span className={`mt-5 inline-flex items-center gap-1.5 font-extrabold ${a.text}`}>
                    C&apos;est parti
                    <ArrowRight className="group-hover-nudge size-5" strokeWidth={2.5} />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-3xl border-2 border-dashed border-border p-10 text-center font-semibold text-muted-foreground">
            Aucun niveau publié pour le moment.
          </p>
        )}
      </div>
    </>
  );
}
