import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ExamVerifyForm } from "@/components/exams/exam-verify-form";
import { FloatingIcons } from "@/components/student/floating-icons";

const DOTS: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, color-mix(in oklch, var(--primary) 20%, transparent) 1.5px, transparent 1.5px)",
  backgroundSize: "26px 26px",
};
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Examen — Plateforme Informatique" };

export default async function ExamEntryPage() {
  const supabase = await createClient();
  const [settings, { data: levelsData }] = await Promise.all([
    getSettings(),
    supabase.from("levels").select("id, name, order_index").eq("is_active", true).order("order_index"),
  ]);

  // Build class options list: "1APIC-1", "1APIC-2", ... for each level
  const classOptions: string[] = [];
  for (const level of levelsData ?? []) {
    const count = settings.class_counts[level.name] ?? 0;
    for (let i = 1; i <= count; i++) {
      classOptions.push(`${level.name}-${i}`);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="absolute inset-0 -z-20" style={DOTS} />
      <FloatingIcons dim />
      <div className="w-full max-w-md">
        <div className="anim-pop mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 -rotate-6 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 shadow-[0_5px_0_0_oklch(0.62_0.15_60)]">
            <KeyRound className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-3xl font-bold">Accès à l&apos;examen</h1>
          <p className="font-semibold text-muted-foreground">
            Saisis le code communiqué par ton enseignant et tes informations.
          </p>
        </div>
        <div
          className="anim-pop rounded-3xl border-2 border-border bg-card p-6 shadow-[0_6px_0_0_var(--border)]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <ExamVerifyForm classOptions={classOptions} />
        </div>
      </div>
    </main>
  );
}
