import Link from "next/link";
import { Code2, Heart } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { StudentNav } from "@/components/student/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Code2 className="size-4" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold">Plateforme Informatique</span>
              <span className="text-[10px] text-muted-foreground">{settings.institution}</span>
            </div>
          </Link>
          <StudentNav />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer : une seule colonne centrée — tutelle administrative de haut en
       * bas (académie → direction → établissement), puis la signature. Pas de
       * logo ni de navigation répétés ici : le header les porte déjà. */}
      <footer className="border-t border-border bg-muted/25">
        <div className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
          <p className="text-sm font-bold">© {schoolYear()} Tous droits réservés</p>

          <div className="mt-4 space-y-1.5 text-sm font-semibold leading-relaxed text-foreground/80">
            <p>{settings.academie}</p>
            <p>{settings.direction}</p>
            <p>{settings.institution}</p>
          </div>

          <div className="mt-7 space-y-1 text-xs leading-relaxed text-muted-foreground">
            <p>
              Conception et réalisation :{" "}
              <span className="font-bold text-foreground">{settings.teacher_name}</span>
            </p>
            <p className="inline-flex items-center justify-center gap-1.5">
              Fait avec
              <Heart className="size-3.5 fill-rose-500 text-rose-500" aria-label="amour" />
              au service de l&apos;éducation numérique
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Année scolaire marocaine : rentrée en septembre, donc 2026-2027 dès le mois 8.
function schoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() >= 8 ? y : y - 1;
  return `${start}-${start + 1}`;
}
