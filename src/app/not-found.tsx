import type { Metadata } from "next";
import Link from "next/link";
import { Code2 } from "lucide-react";
import { NotFoundPanel } from "@/components/not-found-panel";

export const metadata: Metadata = { title: "Page introuvable — Plateforme Informatique" };

// Global 404. There is no header on this one, so the logo mark carries the
// identity and doubles as a way back.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-muted/20 px-4 py-16">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Code2 className="size-4" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold">Plateforme Informatique</span>
      </Link>
      <NotFoundPanel />
    </main>
  );
}
