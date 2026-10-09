import Link from "next/link";
import { BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

// The body of every 404 on the site. Two routes render it: the global
// not-found (unmatched URLs, and notFound() from outside the student shell)
// and the student one, which keeps the header and footer around it.
export function NotFoundPanel() {
  return (
    <div className="mx-auto w-full max-w-md text-center">
      <p className="text-6xl font-bold tracking-tight text-foreground/15 sm:text-7xl">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Page introuvable</h1>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        Cette page n&apos;existe pas, ou elle a été déplacée. Vérifie l&apos;adresse,
        ou repars de l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Accueil
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/courses">
            <BookOpen className="size-4" />
            Les cours
          </Link>
        </Button>
      </div>
    </div>
  );
}
