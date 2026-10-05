import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UnitDialog } from "@/components/admin/units/unit-dialog";
import { CurriculumTree, type UnitTreeRow } from "@/components/admin/units/curriculum-tree";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Unités & Séances — Administration",
};

export default async function AdminCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: levelParam } = await searchParams;
  const supabase = await createClient();

  const { data: levels } = await supabase
    .from("levels")
    .select("id, name")
    .order("order_index");

  const levelId = levelParam ?? levels?.[0]?.id ?? null;
  const currentLevel = levels?.find((l) => l.id === levelId) ?? null;

  // One nested fetch for the whole Unité → Séquence → Séance tree, same
  // embedded-select shape as the public (student)/courses/[level] page —
  // but, unlike that page, nothing here is filtered by is_published and no
  // branch is pruned for being empty: the admin must be able to see (and
  // reach) a draft or still-empty unit/séquence to finish building it out.
  let units: UnitTreeRow[] = [];
  if (levelId) {
    const { data: unitsData } = await supabase
      .from("units")
      .select(
        "id, title, description, image_url, order_index, is_published, sequences(id, title, description, order_index, is_published, sessions(id, title, description, duration_minutes, order_index, is_published))"
      )
      .eq("level_id", levelId)
      .order("order_index");

    units = ((unitsData as unknown as UnitTreeRow[] | null) ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((unit) => ({
        ...unit,
        sequences: (unit.sequences ?? [])
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((sequence) => ({
            ...sequence,
            sessions: (sequence.sessions ?? []).slice().sort((a, b) => a.order_index - b.order_index),
          })),
      }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Unités & Séances</h1>
        {currentLevel ? (
          <UnitDialog
            mode="create"
            levelId={currentLevel.id}
            trigger={<Button>+ Nouvelle unité</Button>}
          />
        ) : null}
      </div>

      {levels && levels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <Link
              key={level.id}
              href={`/admin/sessions?level=${level.id}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                level.id === levelId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {level.name}
            </Link>
          ))}
        </div>
      ) : null}

      {currentLevel ? (
        <CurriculumTree units={units} levelId={currentLevel.id} />
      ) : (
        <p className="text-muted-foreground">
          Aucun niveau disponible — créez-en un depuis « Niveaux ».
        </p>
      )}
    </div>
  );
}
