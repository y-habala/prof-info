import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamSectionsManager, type SectionWithQuestions } from "@/components/admin/exams/exam-sections-manager";
import type { ExamQuestionRow } from "@/components/admin/exams/exam-questions-list";

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

  const [{ data: sectionsData }, { data: questions }] = await Promise.all([
    supabase.from("exam_sections").select("id, title, image_url").eq("exam_id", examId).order("order_index"),
    supabase
      .from("exam_questions")
      .select("id, section_id, question_text, question_type, points, order_index, exam_options(option_text, is_correct)")
      .eq("exam_id", examId)
      .order("order_index"),
  ]);

  const rows: (ExamQuestionRow & { section_id: string | null })[] = (questions ?? []).map((q) => ({
    id: q.id,
    section_id: q.section_id,
    question_text: q.question_text,
    question_type: q.question_type as ExamQuestionRow["question_type"],
    points: q.points,
    exam_options: (q.exam_options ?? []).map((o) => ({
      text: o.option_text,
      isCorrect: o.is_correct,
    })),
  }));

  const sections: SectionWithQuestions[] = (sectionsData ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    image_url: s.image_url,
    questions: rows.filter((q) => q.section_id === s.id),
  }));
  const unsectionedQuestions = rows.filter((q) => q.section_id === null);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/exams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux examens
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Questions — {exam.title}</h1>
      </div>
      <ExamSectionsManager
        examId={exam.id}
        initialSections={sections}
        unsectionedQuestions={unsectionedQuestions}
      />
    </div>
  );
}
