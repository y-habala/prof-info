import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [settings, { data: levelsData }] = await Promise.all([
    getSettings(),
    supabase.from("levels").select("id, name, order_index").eq("is_active", true).order("order_index"),
  ]);
  const levels = (levelsData ?? []).map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations institutionnelles affichées dans l&apos;en-tête et les rapports PDF.
        </p>
      </div>
      <SettingsForm initial={settings} levels={levels} />
    </div>
  );
}
