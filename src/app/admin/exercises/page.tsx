import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExerciseDialog } from "@/components/admin/exercises/exercise-dialog";
import { ExercisesTable, type ExerciseRow } from "@/components/admin/exercises/exercises-table";

export const metadata: Metadata = {
  title: "Exercices — Administration",
};

export default async function AdminExercisesPage() {
  const supabase = await createClient();

  const [{ data: exercises }, { data: levels }, { data: units }, { data: sequences }, { data: sessions }] =
    await Promise.all([
      supabase
        .from("exercises")
        .select(
          "id, title, description, level_id, unit_id, sequence_id, session_id, duration_minutes, is_published, exercise_questions(count)"
        )
        .order("created_at", { ascending: false }),
      supabase.from("levels").select("id, name").order("order_index"),
      supabase.from("units").select("id, title, level_id").order("order_index"),
      supabase.from("sequences").select("id, title, unit_id").order("order_index"),
      supabase.from("sessions").select("id, title, sequence_id").order("order_index"),
    ]);

  const tree = {
    levels: levels ?? [],
    units: units ?? [],
    sequences: sequences ?? [],
    sessions: sessions ?? [],
  };

  const rows: ExerciseRow[] = (exercises ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    level_id: e.level_id,
    unit_id: e.unit_id,
    sequence_id: e.sequence_id,
    session_id: e.session_id,
    duration_minutes: e.duration_minutes,
    is_published: e.is_published,
    question_count: (e.exercise_questions as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Exercices</h1>
        <ExerciseDialog mode="create" tree={tree} trigger={<Button>+ Nouvel exercice</Button>} />
      </div>
      <ExercisesTable exercises={rows} tree={tree} />
    </div>
  );
}
