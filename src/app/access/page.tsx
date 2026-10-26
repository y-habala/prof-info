import type { Metadata } from "next";
import { AccessForm } from "@/components/access/access-form";
import { FloatingIcons } from "@/components/student/floating-icons";
import { Code2 } from "lucide-react";

export const metadata: Metadata = { title: "Accès — Plateforme Informatique" };

const DOTS: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, color-mix(in oklch, var(--primary) 20%, transparent) 1.5px, transparent 1.5px)",
  backgroundSize: "26px 26px",
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <main className="student-theme relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 font-sans">
      <div aria-hidden className="absolute inset-0 -z-20" style={DOTS} />
      <FloatingIcons />

      <div className="w-full max-w-md">
        <div className="anim-pop mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 -rotate-6 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_5px_0_0_var(--primary-deep)]">
            <Code2 className="size-8" strokeWidth={2.75} />
          </div>
          <h1 className="font-heading text-4xl font-bold">
            Plateforme <span className="text-primary">Informatique</span>
          </h1>
          <p className="font-semibold text-muted-foreground">
            Entre ton code d&apos;accès pour commencer.
          </p>
        </div>

        <div
          className="anim-pop rounded-3xl border-2 border-border bg-card p-6 shadow-[0_6px_0_0_var(--border)]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <AccessForm redirectTo={redirect} />
        </div>
      </div>
    </main>
  );
}
