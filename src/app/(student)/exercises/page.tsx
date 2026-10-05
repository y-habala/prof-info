import { Construction } from "lucide-react";

export default function ExercisesComingSoonPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Construction className="size-6" />
      </div>
      <h1 className="text-2xl font-bold">Exercices bientôt disponibles</h1>
      <p className="text-sm text-muted-foreground">
        Cette section est en préparation. Reviens plus tard — ton enseignant y publiera des
        exercices avec correction immédiate.
      </p>
    </div>
  );
}
