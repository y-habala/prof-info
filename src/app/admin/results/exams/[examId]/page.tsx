import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExamAttemptsTable } from "@/components/admin/results/exam-attempts-table";
import { compareByClassAndNumber } from "@/lib/exam-attempt-sort";

export const metadata: Metadata = {
  title: "Résultats de l'examen — Administration",
};

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
  if (!exam) {
    notFound();
  }
  const levelName = (exam.levels as unknown as { name: string } | null)?.name ?? null;

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select(
      "id, student_name, student_first_name, student_number, student_class, student_code, score, max_score, percentage, started_at, submitted_at"
    )
    .eq("exam_id", examId);

  const sortedAttempts = [...(attempts ?? [])].sort(compareByClassAndNumber);
  // The exam's own level is fixed (one exams.level_id), so only "classe"
  // (the section within that level, e.g. "3APIC-2") is a meaningful filter
  // here — the level itself is shown as context instead of a redundant
  // selector that could only ever have one option.
  const availableClasses = Array.from(
    new Set(sortedAttempts.map((a) => a.student_class).filter((c): c is string => !!c))
  ).sort();
  const visibleAttempts = classFilter ? sortedAttempts.filter((a) => a.student_class === classFilter) : sortedAttempts;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/results" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux résultats
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Résultats — {exam.title}</h1>
            {levelName ? <p className="text-sm text-muted-foreground">Niveau : {levelName}</p> : null}
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`/api/admin/results/export?id=${exam.id}`} />}
          >
            Exporter tout (Excel)
          </Button>
        </div>
      </div>

      {availableClasses.length > 0 ? (
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="class" className="text-sm text-muted-foreground">
              Classe
            </label>
            <select id="class" name="class" defaultValue={classFilter ?? ""} className={selectClass}>
              <option value="">Toutes les classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90">
            Filtrer
          </button>
          {classFilter ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={`/api/admin/results/export?id=${exam.id}&class=${encodeURIComponent(classFilter)}`} />}
            >
              Télécharger {classFilter} (Excel)
            </Button>
          ) : null}
        </form>
      ) : null}

      <ExamAttemptsTable examId={exam.id} attempts={visibleAttempts} />
    </div>
  );
}
