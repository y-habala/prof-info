import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExerciseRunner, type RunnerQuestion } from "@/components/exercises/exercise-runner";
import type { ExerciseQuestionType } from "@/schemas/exercises";

export default async function ExerciseRunPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, title, levels(name)")
    .eq("id", exerciseId)
    .eq("is_published", true)
    .maybeSingle();
  if (!exercise) notFound();
  const levelName = (exercise.levels as unknown as { name: string } | null)?.name ?? null;

  const [{ data: questions }, { data: options }] = await Promise.all([
    supabase
      .from("exercise_questions")
      .select("id, question_text, question_type, points, order_index")
      .eq("exercise_id", exerciseId)
      .order("order_index"),
    supabase
      .from("exercise_options")
      .select("id, question_id, option_text, is_correct, order_index")
      .in(
        "question_id",
        (await supabase.from("exercise_questions").select("id").eq("exercise_id", exerciseId)).data?.map(
          (q) => q.id
        ) ?? ["00000000-0000-0000-0000-000000000000"]
      ),
  ]);

  const runnerQuestions: RunnerQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    text: q.question_text,
    type: q.question_type as ExerciseQuestionType,
    points: Number(q.points),
    options: (options ?? [])
      .filter((o) => o.question_id === q.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((o) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct })),
  }));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div>
        <Link
          href="/exercises"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Tous les exercices
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{exercise.title}</h1>
        {levelName ? <p className="mt-1 text-sm text-muted-foreground">{levelName}</p> : null}
      </div>
      {runnerQuestions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Pas encore de questions.
        </p>
      ) : (
        <ExerciseRunner questions={runnerQuestions} />
      )}
    </div>
  );
}
