"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  GraduationCap,
  BarChart3,
  KeyRound,
  Settings,
  FolderOpen,
  Menu,
  X,
  LogOut,
  Code2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/curriculum", label: "Cours", icon: Library },
  { href: "/admin/exams", label: "Examens", icon: GraduationCap },
  { href: "/admin/results", label: "Résultats", icon: BarChart3 },
  { href: "/admin/access-codes", label: "Codes d'accès", icon: KeyRound },
  { href: "/admin/files", label: "Fichiers", icon: FolderOpen },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function isActive(item: (typeof NAV)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Code2 className="size-4" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-bold">P. Informatique</p>
            <p className="text-[10px] text-muted-foreground">Administration</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-10 items-center justify-center rounded-lg border border-border"
            aria-label="Ouvrir le menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="text-sm font-semibold">Administration</span>
          <div className="size-10" />
        </header>
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
