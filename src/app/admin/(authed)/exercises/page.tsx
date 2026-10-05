import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminExercisesPage() {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Construction className="size-5" />
      </div>
      <h1 className="text-xl font-bold">Exercices — en préparation</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        La gestion des exercices autonomes sera disponible dans la prochaine mise à jour.
      </p>
    </Card>
  );
}
