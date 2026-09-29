import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitDialog } from "@/components/admin/units/unit-dialog";
import { UnitsTable } from "@/components/admin/units/units-table";

export const metadata: Metadata = {
  title: "Unités — Administration",
};

export default async function AdminUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level: levelId } = await searchParams;
  const supabase = await createClient();

  if (!levelId) {
    const { data: levels } = await supabase
      .from("levels")
      .select("id, name")
      .order("order_index");

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Unités</h1>
        <p className="text-muted-foreground">Choisissez un niveau pour gérer ses unités.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(levels ?? []).map((level) => (
            <Link key={level.id} href={`/admin/units?level=${level.id}`}>
              <Card className="transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle>{level.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const { data: level } = await supabase
    .from("levels")
    .select("id, name")
    .eq("id", levelId)
    .maybeSingle();

  const { data: units } = await supabase
    .from("units")
    .select("id, title, description, image_url, order_index, is_published")
    .eq("level_id", levelId)
    .order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/units" className="text-sm text-muted-foreground hover:text-foreground">
          ← Tous les niveaux
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Unités — {level?.name ?? "Niveau inconnu"}</h1>
          <UnitDialog mode="create" levelId={levelId} trigger={<Button>+ Nouvelle unité</Button>} />
        </div>
      </div>
      <UnitsTable units={units ?? []} levelId={levelId} />
    </div>
  );
}
