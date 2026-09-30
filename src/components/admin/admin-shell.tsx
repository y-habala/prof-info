"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "./sidebar";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className={cn("md:block", mobileOpen ? "block" : "hidden")}>
        <AdminSidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
            <span className="font-semibold">Administration</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">{userEmail}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Déconnexion
              </Button>
            </form>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
