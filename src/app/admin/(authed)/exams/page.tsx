import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminExamsPage() {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Construction className="size-5" />
      </div>
      <h1 className="text-xl font-bold">Examens — en préparation</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Le constructeur d&apos;examens (avec modèles A/B/C/D) arrive dans la prochaine mise à jour.
      </p>
    </Card>
  );
}
