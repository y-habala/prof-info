import { FileManager } from "@/components/admin/settings/file-manager";
import { Card } from "@/components/ui/card";

export default function AdminFilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fichiers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envoie des images, vidéos et documents. Copie ensuite le lien pour
          l&apos;utiliser dans les blocs de contenu des séances.
        </p>
      </div>
      <Card className="p-6">
        <FileManager />
      </Card>
    </div>
  );
}
