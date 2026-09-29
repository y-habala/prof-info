import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { QuestionDialog } from "@/components/admin/exercises/question-dialog";
import { QuestionsList, type QuestionRow } from "@/components/admin/exercises/questions-list";

export const metadata: Metadata = {
  title: "Questions de l'exercice — Administration",
};

export default async function AdminExerciseQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: exerciseId } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, title")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("exercise_questions")
    .select("id, question_text, question_type, points, image_url, explanation, exercise_options(option_text, is_correct)")
    .eq("exercise_id", exerciseId)
    .order("order_index");

  const rows: QuestionRow[] = (questions ?? []).map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type as QuestionRow["question_type"],
    points: q.points,
    image_url: q.image_url,
    explanation: q.explanation,
    exercise_options: (q.exercise_options ?? []).map((o) => ({
      text: o.option_text,
      isCorrect: o.is_correct,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/exercises" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux exercices
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Questions — {exercise.title}</h1>
          <QuestionDialog
            mode="create"
            exerciseId={exercise.id}
            nextOrderIndex={rows.length}
            trigger={<Button>+ Ajouter une question</Button>}
          />
        </div>
      </div>
      <QuestionsList exerciseId={exercise.id} initialQuestions={rows} />
    </div>
  );
}
