import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ExamAttemptsTable, type AttemptRow } from "@/components/admin/results/exam-attempts-table";
import { compareByClassAndNumber } from "@/lib/exam-attempt-sort";
import { scoreOutOf20 } from "@/lib/grading";

export default async function AdminExamResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ class?: string }>;
}) {
  const { examId } = await params;
  const { class: classFilter } = await searchParams;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, levels(name)")
    .eq("id", examId)
    .maybeSingle();
  if (!exam) notFound();
  const levelName = (exam.levels as unknown as { name: string } | null)?.name ?? null;

  // Resolve all models of this exam
  const { data: models } = await supabase
    .from("exam_models")
    .select("id, label")
    .eq("exam_id", examId);
  const modelLabelById = new Map((models ?? []).map((m) => [m.id, m.label]));
  const modelIds = (models ?? []).map((m) => m.id);

  const attempts: AttemptRow[] =
    modelIds.length === 0
      ? []
      : (
          await supabase
            .from("exam_attempts")
            .select(
              "id, exam_model_id, student_name, student_first_name, student_number, student_class, score, max_score, started_at, submitted_at"
            )
            .in("exam_model_id", modelIds)
        ).data
          ?.map((a) => ({
            id: a.id,
            model_label: modelLabelById.get(a.exam_model_id) ?? "?",
            student_name: a.student_name,
            student_first_name: a.student_first_name,
            student_number: a.student_number,
            student_class: a.student_class,
            score20:
              a.submitted_at && a.max_score && Number(a.max_score) > 0
                ? scoreOutOf20(Number(a.score ?? 0), Number(a.max_score))
                : null,
            started_at: a.started_at,
            submitted_at: a.submitted_at,
          }))
          .sort(compareByClassAndNumber) ?? [];

  const availableClasses = Array.from(
    new Set(attempts.map((a) => a.student_class).filter((c): c is string => !!c))
  ).sort();
  const visible = classFilter ? attempts.filter((a) => a.student_class === classFilter) : attempts;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/results" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Tous les résultats
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            {levelName ? <p className="mt-1 text-sm text-muted-foreground">Niveau : {levelName}</p> : null}
          </div>
          <Button asChild variant="outline" className="gap-2">
            <a href={`/api/admin/exams/${exam.id}/export`}>
              <Download className="size-4" />
              Exporter tout (Excel)
            </a>
          </Button>
        </div>
      </div>

      {availableClasses.length > 0 ? (
        <form method="GET" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1">
            <label htmlFor="class" className="text-sm font-medium text-muted-foreground">
              Classe
            </label>
            <Select id="class" name="class" defaultValue={classFilter ?? ""}>
              <option value="">Toutes les classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Filtrer</Button>
          {classFilter ? (
            <>
              <Button asChild variant="outline" className="gap-2">
                <a href={`/api/admin/exams/${exam.id}/export?class=${encodeURIComponent(classFilter)}`}>
                  <Download className="size-4" />
                  Excel {classFilter}
                </a>
              </Button>
              <Button asChild className="gap-2">
                <a
                  href={`/api/admin/exams/${exam.id}/class-report?class=${encodeURIComponent(classFilter)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="size-4" />
                  Rapport PDF — {classFilter}
                </a>
              </Button>
            </>
          ) : null}
        </form>
      ) : null}

      <ExamAttemptsTable examId={exam.id} attempts={visible} />
    </div>
  );
}
