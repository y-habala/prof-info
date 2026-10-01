import Link from "next/link";
import { Code2 } from "lucide-react";

const FOOTER_SECTIONS = [
  {
    title: "Navigation",
    links: [
      { href: "/", label: "Accueil" },
      { href: "/courses", label: "Cours" },
      { href: "/actualites", label: "Actualités" },
    ],
  },
  {
    title: "S'entraîner",
    links: [
      { href: "/exercises", label: "Exercices" },
      { href: "/exam", label: "Accès examen" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Code2 className="size-4.5" />
              </span>
              Plateforme Informatique
            </Link>
            <p className="max-w-xs text-sm text-background/65">
              Cours, exercices interactifs et examens d&apos;informatique pour les collégiens marocains.
            </p>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} className="space-y-3">
              <p className="text-xs font-bold tracking-wider text-background uppercase">
                {section.title}
                <span className="mt-1.5 block h-0.5 w-6 bg-gold" />
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-background/65 transition-colors hover:text-background">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-background/15 pt-6 text-sm text-background/55">
          © {new Date().getFullYear()} Plateforme Informatique
        </div>
      </div>
    </footer>
  );
}
