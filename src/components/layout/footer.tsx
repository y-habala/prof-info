import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold">Plateforme Informatique</span>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/courses" className="hover:text-foreground">
            Cours
          </Link>
          <Link href="/exercises" className="hover:text-foreground">
            Exercices
          </Link>
          <Link href="/exam" className="hover:text-foreground">
            Examens
          </Link>
          <Link href="/actualites" className="hover:text-foreground">
            Actualités
          </Link>
        </nav>
        <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
