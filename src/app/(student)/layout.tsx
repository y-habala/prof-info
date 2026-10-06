import Link from "next/link";
import { Code2 } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { StudentNav } from "@/components/student/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4">
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

      {/* Footer volontairement compact : la tutelle administrative tient sur
       * une seule ligne séparée par des points, pas en colonnes étiquetées. */}
      <footer className="border-t border-border bg-muted/25">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-8 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <p className="max-w-xl">
            <span className="font-semibold text-foreground">{settings.institution}</span>
            <Dot />
            {settings.direction}
            <Dot />
            {settings.academie}
          </p>
          <p className="shrink-0">
            <span className="font-semibold text-foreground">{settings.teacher_name}</span>
            <Dot />© {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Dot() {
  return <span className="mx-2 text-border">•</span>;
}
