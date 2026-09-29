import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SequenceDialog } from "@/components/admin/sequences/sequence-dialog";
import { SequencesTable } from "@/components/admin/sequences/sequences-table";

export const metadata: Metadata = {
  title: "Séquences — Administration",
};

export default async function AdminSequencesPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const { unit: unitId } = await searchParams;
  const supabase = await createClient();

  if (!unitId) {
    const { data: units } = await supabase
      .from("units")
      .select("id, title, level_id, levels(name)")
      .order("order_index");

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Séquences</h1>
        <p className="text-muted-foreground">Choisissez une unité pour gérer ses séquences.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(units ?? []).map((unit) => (
            <Link key={unit.id} href={`/admin/sequences?unit=${unit.id}`}>
              <Card className="transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle>{unit.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {(unit.levels as unknown as { name: string } | null)?.name}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const { data: unit } = await supabase
    .from("units")
    .select("id, title, level_id")
    .eq("id", unitId)
    .maybeSingle();

  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, title, description, order_index, is_published")
    .eq("unit_id", unitId)
    .order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/sequences"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Toutes les unités
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Séquences — {unit?.title ?? "Unité inconnue"}
          </h1>
          {unit ? (
            <SequenceDialog
              mode="create"
              unitId={unit.id}
              unitLevelId={unit.level_id}
              trigger={<Button>+ Nouvelle séquence</Button>}
            />
          ) : null}
        </div>
      </div>
      {unit ? (
        <SequencesTable
          sequences={sequences ?? []}
          unitId={unit.id}
          unitLevelId={unit.level_id}
        />
      ) : (
        <p className="text-muted-foreground">Unité introuvable.</p>
      )}
    </div>
  );
}
