import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations institutionnelles affichées dans l&apos;en-tête et les rapports PDF.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
