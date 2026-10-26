"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, BookOpen, KeyRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: string;
  idle: string;
  edge: string;
};

// Lucide icons can't cross the server→client boundary as props, so the items
// live here. Each section owns a colour the student can learn to recognise.
const ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Accueil",
    icon: Home,
    active: "bg-primary text-white",
    idle: "text-primary hover:bg-primary/10",
    edge: "var(--primary-deep)",
  },
  {
    href: "/courses",
    label: "Cours",
    icon: BookOpen,
    active: "bg-teal-600 text-white",
    idle: "text-teal-700 hover:bg-teal-600/10",
    edge: "oklch(0.42 0.09 185)",
  },
  {
    href: "/exam",
    label: "Examen",
    icon: KeyRound,
    active: "bg-amber-500 text-white",
    idle: "text-amber-700 hover:bg-amber-500/12",
    edge: "oklch(0.58 0.14 60)",
  },
];

export function StudentNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav className="hidden items-center gap-2 sm:flex">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                active ? cn(item.active, "btn-chunky") : item.idle
              )}
              style={active ? ({ "--chunky-edge": item.edge } as React.CSSProperties) : undefined}
            >
              <Icon className="group-hover-wiggle size-4" strokeWidth={2.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-2xl border-2 border-border bg-card text-foreground transition-colors hover:bg-muted sm:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-40 border-b border-border bg-card p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 sm:hidden">
          <ul className="flex flex-col gap-2">
            {ITEMS.map((item, i) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href} className="anim-pop" style={{ "--i": i } as React.CSSProperties}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold",
                      active ? item.active : cn(item.idle, "bg-muted/40")
                    )}
                  >
                    <Icon className="size-5" strokeWidth={2.5} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
