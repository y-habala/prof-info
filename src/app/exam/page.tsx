import { Construction } from "lucide-react";
import Link from "next/link";

export default function ExamComingSoonPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Construction className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Examen bientôt disponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;entrée des codes d&apos;examen sera activée dans la prochaine mise à jour.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
