import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExerciseRunner } from "@/components/exercises/exercise-runner";

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, title, description")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (!exercise) {
    notFound();
  }

  // exercise_questions/exercise_options have zero anon RLS access (they can
  // reveal correct answers) — service role bypasses that deliberately here,
  // and is_correct is stripped below before anything reaches the client.
  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("exercise_questions")
    .select("id, question_text, question_type, points, image_url, order_index, exercise_options(id, option_text, order_index)")
    .eq("exercise_id", id)
    .order("order_index");

  const scrubbedQuestions = (questions ?? []).map((q) => ({
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    points: q.points,
    imageUrl: q.image_url,
    options: (q.exercise_options ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((o) => ({ id: o.id, text: o.option_text })),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{exercise.title}</h1>
        {exercise.description ? (
          <p className="mt-1 text-muted-foreground">{exercise.description}</p>
        ) : null}
      </div>
      <ExerciseRunner exerciseId={exercise.id} questions={scrubbedQuestions} />
    </div>
  );
}
