import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  CurriculumTree,
  type LevelTreeRow,
  type SessionRow,
} from "@/components/admin/curriculum/curriculum-tree";
import { LevelDialog } from "@/components/admin/curriculum/level-dialog";
import { cn } from "@/lib/utils";

export default async function AdminCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: levelParam } = await searchParams;
  const supabase = await createClient();

  const { data: levels } = await supabase
    .from("levels")
    .select("id, name, order_index, is_active")
    .order("order_index");

  const activeLevelId = levelParam ?? levels?.[0]?.id ?? null;
  const current = levels?.find((l) => l.id === activeLevelId) ?? null;

  let tree: LevelTreeRow | null = null;
  if (current) {
    const { data: unitsData } = await supabase
      .from("units")
      .select("id, title, order_index, is_published, sequences(id, title, order_index, is_published, sessions(id, title, duration_minutes, content_markdown, order_index, is_published))")
      .eq("level_id", current.id)
      .order("order_index");

    const rawUnits = (unitsData as unknown as LevelTreeRow["units"]) ?? [];

    // Séances with no séquence are fetched on their own rather than embedded:
    // sessions now reach units by two routes (directly, and through a
    // séquence), and a separate query keeps which one is meant unambiguous.
    const unitIds = rawUnits.map((u) => u.id);
    const { data: looseSessions } = unitIds.length
      ? await supabase
          .from("sessions")
          .select("id, title, duration_minutes, content_markdown, order_index, is_published, unit_id")
          .in("unit_id", unitIds)
          .is("sequence_id", null)
      : { data: [] };

    const byUnit = new Map<string, SessionRow[]>();
    for (const row of (looseSessions ?? []) as (SessionRow & { unit_id: string })[]) {
      const list = byUnit.get(row.unit_id) ?? [];
      list.push(row);
      byUnit.set(row.unit_id, list);
    }

    tree = {
      id: current.id,
      name: current.name,
      units: rawUnits
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((u) => ({
          ...u,
          sessions: (byUnit.get(u.id) ?? []).sort((a, b) => a.order_index - b.order_index),
          sequences: (u.sequences ?? [])
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((s) => ({
              ...s,
              sessions: (s.sessions ?? []).slice().sort((a, b) => a.order_index - b.order_index),
            })),
        })),
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cours</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Niveau → Unité → Séquence → Séance. Tout se gère ici en une seule page.
          </p>
        </div>
        <LevelDialog
          mode="create"
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Nouveau niveau
            </Button>
          }
        />
      </div>

      {levels && levels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {levels.map((lvl) => (
            <Link
              key={lvl.id}
              href={`/admin/curriculum?level=${lvl.id}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                lvl.id === activeLevelId
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {lvl.name}
              {!lvl.is_active ? <span className="ml-1.5 text-xs opacity-70">(inactif)</span> : null}
            </Link>
          ))}
        </div>
      ) : null}

      {tree ? (
        <CurriculumTree level={tree} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Crée un niveau pour commencer (ex. 1APIC, 2APIC, 3APIC).
        </div>
      )}
    </div>
  );
}
