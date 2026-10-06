import Link from "next/link";
import { ArrowRight, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scoreOutOf20 } from "@/lib/grading";

type ExamStats = {
  id: string;
  title: string;
  levelName: string | null;
  totalAttempts: number;
  submittedAttempts: number;
  avg20: number | null;
};

export default async function AdminResultsPage() {
  const supabase = await createClient();

  // Fetch all exams + their models (to resolve attempts) + attempt metadata
  const [{ data: exams }, { data: models }, { data: attempts }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, level_id, levels(name)")
      .order("created_at", { ascending: false }),
    supabase.from("exam_models").select("id, exam_id"),
    supabase.from("exam_attempts").select("exam_model_id, score, max_score, submitted_at"),
  ]);

  // Build a model→exam map
  const modelToExam = new Map<string, string>();
  for (const m of models ?? []) modelToExam.set(m.id, m.exam_id);

  // Group attempt stats per exam
  const statsByExam = new Map<string, { total: number; submitted: number; sum20: number; count20: number }>();
  for (const a of attempts ?? []) {
    const examId = modelToExam.get(a.exam_model_id);
    if (!examId) continue;
    const row = statsByExam.get(examId) ?? { total: 0, submitted: 0, sum20: 0, count20: 0 };
    row.total++;
    if (a.submitted_at) {
      row.submitted++;
      const s20 = scoreOutOf20(Number(a.score ?? 0), Number(a.max_score ?? 0));
      row.sum20 += s20;
      row.count20++;
    }
    statsByExam.set(examId, row);
  }

  const examStats: ExamStats[] = (exams ?? []).map((e) => {
    const stats = statsByExam.get(e.id);
    return {
      id: e.id,
      title: e.title,
      levelName: (e.levels as unknown as { name: string } | null)?.name ?? null,
      totalAttempts: stats?.total ?? 0,
      submittedAttempts: stats?.submitted ?? 0,
      avg20: stats && stats.count20 > 0 ? stats.sum20 / stats.count20 : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Résultats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d&apos;ensemble des tentatives, regroupées sous l&apos;examen parent (tous modèles
          confondus).
        </p>
      </div>

      {examStats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Aucun examen pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {examStats.map((e) => (
            <Link
              key={e.id}
              href={`/admin/results/exams/${e.id}`}
              className="group block"
            >
              <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{e.title}</p>
                    {e.levelName ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{e.levelName}</p>
                    ) : null}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5" />
                    {e.submittedAttempts}/{e.totalAttempts}
                  </span>
                  {e.avg20 !== null ? (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="size-3" />
                      {e.avg20.toFixed(2)}/20
                    </Badge>
                  ) : (
                    <Badge variant="outline">—</Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
