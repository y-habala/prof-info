"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/courses", label: "Cours" },
  { href: "/exam", label: "Examens" },
  { href: "/actualites", label: "Actualités" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Code2 className="size-4.5" />
          </span>
          <span className="hidden sm:inline">Plateforme Informatique</span>
          <span className="sm:hidden">P. Info</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border-b-2 py-1 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/login"
            className="hidden text-xs text-muted-foreground hover:text-foreground md:block"
          >
            Admin
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t md:hidden">
          <div className="flex flex-col gap-0.5 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg border-s-[3px] px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "border-s-primary bg-primary/5 font-semibold text-primary"
                    : "border-s-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
