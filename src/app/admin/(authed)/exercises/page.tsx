import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExerciseDialog } from "@/components/admin/exercises/exercise-dialog";
import { ExercisesTable, type ExerciseRow } from "@/components/admin/exercises/exercises-table";

export default async function AdminExercisesPage() {
  const supabase = await createClient();

  const [{ data: exercises }, { data: levels }] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, title, level_id, order_index, is_published, exercise_questions(count)")
      .order("created_at", { ascending: false }),
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
  ]);

  const rows: ExerciseRow[] = (exercises ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    level_id: e.level_id,
    order_index: e.order_index,
    is_published: e.is_published,
    question_count: (e.exercise_questions as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entraînement libre — l&apos;élève voit la correction immédiatement, aucune note stockée.
          </p>
        </div>
        <ExerciseDialog
          mode="create"
          levels={levels ?? []}
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Nouvel exercice
            </Button>
          }
        />
      </div>
      <ExercisesTable exercises={rows} levels={levels ?? []} />
    </div>
  );
}
