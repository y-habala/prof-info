import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExamQuestionDialog } from "@/components/admin/exams/exam-question-dialog";
import { ExamQuestionsList, type ExamQuestionRow } from "@/components/admin/exams/exam-questions-list";

export const metadata: Metadata = {
  title: "Questions de l'examen — Administration",
};

export default async function AdminExamQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title")
    .eq("id", examId)
    .maybeSingle();

  if (!exam) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("exam_questions")
    .select("id, question_text, question_type, points, exam_options(option_text, is_correct)")
    .eq("exam_id", examId)
    .order("order_index");

  const rows: ExamQuestionRow[] = (questions ?? []).map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type as ExamQuestionRow["question_type"],
    points: q.points,
    exam_options: (q.exam_options ?? []).map((o) => ({
      text: o.option_text,
      isCorrect: o.is_correct,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/exams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux examens
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Questions — {exam.title}</h1>
          <ExamQuestionDialog
            mode="create"
            examId={exam.id}
            nextOrderIndex={rows.length}
            trigger={<Button>+ Ajouter une question</Button>}
          />
        </div>
      </div>
      <ExamQuestionsList examId={exam.id} initialQuestions={rows} />
    </div>
  );
}
