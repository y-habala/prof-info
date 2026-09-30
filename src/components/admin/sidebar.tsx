"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Only sections that actually exist yet — extend as later phases land
// (see spec section 44 for the full intended structure).
const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/levels", label: "Niveaux" },
  { href: "/admin/units", label: "Unités" },
  { href: "/admin/sequences", label: "Séquences" },
  { href: "/admin/sessions", label: "Séances" },
  { href: "/admin/exercises", label: "Exercices" },
  { href: "/admin/html-pages", label: "Activités HTML" },
  { href: "/admin/exams", label: "Examens" },
  { href: "/admin/results", label: "Résultats" },
  { href: "/admin/announcements", label: "Actualités" },
  { href: "/admin/access-codes", label: "Codes d'accès" },
  { href: "/admin/files", label: "Fichiers" },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 border-e p-4 md:w-48">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted font-medium text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
