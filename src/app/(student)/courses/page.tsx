import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesLandingPage() {
  const supabase = await createClient();
  const { data: levels } = await supabase.from("levels").select("id, name").order("order_index");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cours</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisis ton niveau pour accéder aux unités, séquences et séances.
        </p>
      </div>

      {levels && levels.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((lvl) => (
            <Link
              key={lvl.id}
              href={`/courses/${lvl.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <GraduationCap className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{lvl.name}</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Aucun niveau publié pour le moment.
        </p>
      )}
    </div>
  );
}
