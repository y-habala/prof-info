import Link from "next/link";
import { Code2 } from "lucide-react";
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

      <footer className="border-t border-border bg-muted/25">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Identité de la plateforme */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Code2 className="size-4" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold">Plateforme Informatique</span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Cours, séances et examens d&apos;informatique pour l&apos;enseignement
                secondaire collégial.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <FooterTitle>Navigation</FooterTitle>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
                    Cours
                  </Link>
                </li>
                <li>
                  <Link href="/exam" className="text-muted-foreground transition-colors hover:text-foreground">
                    Examen
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tutelle administrative */}
            <div>
              <FooterTitle>Établissement</FooterTitle>
              <dl className="mt-4 space-y-3 text-sm">
                <FooterItem label="Académie" value={settings.academie} />
                <FooterItem label="Direction" value={settings.direction} />
                <FooterItem label="Établissement" value={settings.institution} />
              </dl>
            </div>

            {/* Enseignant */}
            <div>
              <FooterTitle>Enseignant</FooterTitle>
              <dl className="mt-4 space-y-3 text-sm">
                <FooterItem label="Responsable" value={settings.teacher_name} />
                <FooterItem label="Matière" value="Informatique" />
              </dl>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {settings.institution}. Tous droits réservés.
            </p>
            <p>Royaume du Maroc — Ministère de l&apos;Éducation Nationale</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
      {children}
    </p>
  );
}

function FooterItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}
