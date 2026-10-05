import type { Metadata } from "next";
import { AccessForm } from "@/components/access/access-form";
import { Code2 } from "lucide-react";

export const metadata: Metadata = { title: "Accès — Plateforme Informatique" };

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-accent/30 px-4 py-16">
      {/* Decorative background orbs — soft, non-distracting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/4 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 size-80 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Code2 className="size-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Plateforme Informatique</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre code d&apos;accès pour commencer.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <AccessForm redirectTo={redirect} />
        </div>
      </div>
    </main>
  );
}
