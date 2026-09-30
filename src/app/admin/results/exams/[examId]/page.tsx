import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamAttemptsTable } from "@/components/admin/results/exam-attempts-table";

export const metadata: Metadata = {
  title: "Résultats de l'examen — Administration",
};

export default async function AdminExamResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase.from("exams").select("id, title").eq("id", examId).maybeSingle();
  if (!exam) {
    notFound();
  }

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select(
      "id, student_name, student_first_name, student_class, student_code, score, max_score, percentage, started_at, submitted_at"
    )
    .eq("exam_id", examId)
    .order("started_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/results" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux résultats
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Résultats — {exam.title}</h1>
      </div>
      <ExamAttemptsTable examId={exam.id} attempts={attempts ?? []} />
    </div>
  );
}
