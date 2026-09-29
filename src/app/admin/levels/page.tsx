import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LevelDialog } from "@/components/admin/levels/level-dialog";
import { LevelsTable } from "@/components/admin/levels/levels-table";

export const metadata: Metadata = {
  title: "Niveaux — Administration",
};

export default async function AdminLevelsPage() {
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("id, name, description, order_index, is_active")
    .order("order_index");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Niveaux</h1>
        <LevelDialog mode="create" trigger={<Button>+ Nouveau niveau</Button>} />
      </div>
      <LevelsTable levels={levels ?? []} />
    </div>
  );
}
