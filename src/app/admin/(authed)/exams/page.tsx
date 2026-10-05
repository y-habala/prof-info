import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExamDialog } from "@/components/admin/exams/exam-dialog";
import { ExamsTable, type ExamRow } from "@/components/admin/exams/exams-table";

export default async function AdminExamsPage() {
  const supabase = await createClient();

  const [{ data: exams }, { data: levels }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, level_id, duration_minutes, start_at, end_at, max_attempts, is_published, is_active, exam_models(count)")
      .order("created_at", { ascending: false }),
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
  ]);

  const rows: ExamRow[] = (exams ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    level_id: e.level_id,
    duration_minutes: e.duration_minutes,
    start_at: e.start_at,
    end_at: e.end_at,
    max_attempts: e.max_attempts,
    is_published: e.is_published,
    is_active: e.is_active,
    model_count: (e.exam_models as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un examen = plusieurs modèles (A, B, C, D…) partageant les mêmes élèves.
          </p>
        </div>
        <ExamDialog
          mode="create"
          levels={levels ?? []}
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Nouvel examen
            </Button>
          }
        />
      </div>
      <ExamsTable exams={rows} levels={levels ?? []} />
    </div>
  );
}
