import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExamModelDialog } from "@/components/admin/exams/exam-model-dialog";
import { ExamModelCard } from "@/components/admin/exams/exam-model-card";

export default async function AdminExamModelsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, levels(name)")
    .eq("id", examId)
    .maybeSingle();
  if (!exam) notFound();

  const levelName = (exam.levels as unknown as { name: string } | null)?.name ?? null;

  const { data: models } = await supabase
    .from("exam_models")
    .select("id, label, secret_code, order_index, exam_questions(count), exam_sections(count)")
    .eq("exam_id", examId)
    .order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/exams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Tous les examens
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            {levelName ? <p className="mt-1 text-sm text-muted-foreground">Niveau : {levelName}</p> : null}
          </div>
          <ExamModelDialog
            examId={examId}
            mode="create"
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Nouveau modèle
              </Button>
            }
          />
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">Modèles (A, B, C, D…)</p>
            <p className="text-sm text-muted-foreground">
              Chaque modèle a ses propres questions et son propre code. Les élèves d&apos;une même classe
              peuvent passer des modèles différents — les résultats sont automatiquement regroupés sous
              cet examen.
            </p>
          </div>
        </div>
      </Card>

      {models && models.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <ExamModelCard
              key={m.id}
              examId={examId}
              model={{
                id: m.id,
                label: m.label,
                secret_code: m.secret_code,
                sections_count: (m.exam_sections as unknown as { count: number }[])?.[0]?.count ?? 0,
                questions_count: (m.exam_questions as unknown as { count: number }[])?.[0]?.count ?? 0,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Aucun modèle. Crée au moins un modèle (<strong>A</strong>) pour commencer.
        </div>
      )}
    </div>
  );
}
