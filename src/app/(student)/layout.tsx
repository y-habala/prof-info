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

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {settings.institution} • {settings.academie}
          </p>
          <p>Enseignant : {settings.teacher_name}</p>
        </div>
      </footer>
    </div>
  );
}
