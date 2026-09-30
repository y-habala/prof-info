import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DevoirDialog } from "@/components/admin/devoirs/devoir-dialog";
import { DevoirsTable, type DevoirRow } from "@/components/admin/devoirs/devoirs-table";

export const metadata: Metadata = {
  title: "Devoirs — Administration",
};

export default async function AdminDevoirsPage() {
  const supabase = await createClient();
  const [{ data: devoirs }, { data: levels }] = await Promise.all([
    supabase
      .from("devoirs")
      .select("id, title, session, level_id, levels(name)")
      .order("created_at", { ascending: false }),
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
  ]);

  const rows: DevoirRow[] = (devoirs ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    session: d.session,
    level_id: d.level_id,
    level_name: (d.levels as unknown as { name: string } | null)?.name ?? "—",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Devoirs</h1>
        <DevoirDialog mode="create" levels={levels ?? []} trigger={<Button>+ Nouveau devoir</Button>} />
      </div>
      <p className="text-sm text-muted-foreground">
        Un devoir regroupe plusieurs examens (modèles A/B/C...) pour produire un seul rapport de
        classe. Créez le devoir ici, puis associez-le à chaque modèle dans{" "}
        <span className="font-medium">Examens</span>.
      </p>
      <DevoirsTable devoirs={rows} levels={levels ?? []} />
    </div>
  );
}
