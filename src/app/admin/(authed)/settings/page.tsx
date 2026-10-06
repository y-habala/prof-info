import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { FileManager } from "@/components/admin/settings/file-manager";
import { Card } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-10">
      {/* Institutional info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informations institutionnelles affichées dans l&apos;en-tête et les rapports PDF.
          </p>
        </div>
        <SettingsForm initial={settings} />
      </div>

      {/* File manager */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gestionnaire de fichiers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Envoie des images, vidéos et documents. Copie ensuite le lien pour
            l&apos;utiliser dans les blocs de contenu des séances.
          </p>
        </div>
        <Card className="p-6">
          <FileManager />
        </Card>
      </div>
    </div>
  );
}
