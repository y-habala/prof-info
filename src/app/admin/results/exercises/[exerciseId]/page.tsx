import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseAttemptsTable } from "@/components/admin/results/exercise-attempts-table";

export const metadata: Metadata = {
  title: "Résultats de l'exercice — Administration",
};

export default async function AdminExerciseResultsPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, title")
    .eq("id", exerciseId)
    .maybeSingle();
  if (!exercise) {
    notFound();
  }

  const { data: attempts } = await supabase
    .from("exercise_attempts")
    .select("id, student_name, student_first_name, student_class, score, max_score, percentage, started_at, completed_at")
    .eq("exercise_id", exerciseId)
    .order("started_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/results" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux résultats
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Résultats — {exercise.title}</h1>
      </div>
      <ExerciseAttemptsTable exerciseId={exercise.id} attempts={attempts ?? []} />
    </div>
  );
}
