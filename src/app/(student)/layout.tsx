import Link from "next/link";
import { Code2, Heart } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { StudentNav } from "@/components/student/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="student-theme flex min-h-screen flex-col bg-background font-sans">
      <header className="sticky top-0 z-30 bg-card/95 shadow-[0_1px_0_0_var(--border)] backdrop-blur">
        <div aria-hidden className="brand-stripe h-1.5" />
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <div className="flex size-11 -rotate-6 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_4px_0_0_var(--primary-deep)] transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105">
              <Code2 className="size-5" strokeWidth={2.75} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-lg font-bold">
                Plateforme <span className="text-primary">Informatique</span>
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {settings.institution}
              </span>
            </div>
          </Link>
          <StudentNav />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Tutelle administrative de haut en bas (académie → direction →
       * établissement), puis la signature. */}
      <footer className="relative bg-foreground text-background">
        <div aria-hidden className="brand-stripe h-1.5" />
        <div className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
          <div className="mx-auto mb-6 flex size-12 -rotate-6 items-center justify-center rounded-2xl bg-primary text-white">
            <Code2 className="size-6" strokeWidth={2.75} />
          </div>
          <p className="font-heading text-base font-bold">© {schoolYear()} Tous droits réservés</p>

          <div className="mt-4 space-y-1.5 text-sm font-semibold leading-relaxed text-background/75">
            <p>{settings.academie}</p>
            <p>{settings.direction}</p>
            <p>{settings.institution}</p>
          </div>

          <div className="mt-7 space-y-1 text-xs leading-relaxed text-background/60">
            <p>
              Conception et réalisation :{" "}
              <span className="font-bold text-background">{settings.teacher_name}</span>
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
