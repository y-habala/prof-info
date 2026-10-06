import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExerciseQuestionDialog } from "@/components/admin/curriculum/exercise-question-dialog";
import { ExerciseQuestionsList, type QuestionData } from "@/components/admin/curriculum/exercise-questions-list";
import type { ExerciseQuestionType } from "@/schemas/exercises";

export default async function AdminSessionExercisePage({
  params,
}: {
  params: Promise<{ sessionId: string; exerciseId: string }>;
}) {
  const { sessionId, exerciseId } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, title")
    .eq("id", exerciseId)
    .maybeSingle();
  if (!exercise) notFound();

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

  const data: QuestionData[] = (questions ?? []).map((q) => ({
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
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/curriculum/sessions/${sessionId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour au contenu de la séance
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{exercise.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Édition des questions de l&apos;exercice</p>
          </div>
          <ExerciseQuestionDialog
            mode="create"
            exerciseId={exerciseId}
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Nouvelle question
              </Button>
            }
          />
        </div>
      </div>

      <ExerciseQuestionsList exerciseId={exerciseId} questions={data} />
    </div>
  );
}
