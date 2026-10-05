import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ExamDialog } from "@/components/admin/exams/exam-dialog";
import { ExamsTable, type ExamRow } from "@/components/admin/exams/exams-table";

export const metadata: Metadata = {
  title: "Examens — Administration",
};

export default async function AdminExamsPage() {
  const supabase = await createClient();
  const [{ data: exams }, { data: levels }] = await Promise.all([
    supabase
      .from("exams")
      .select(
        "id, title, description, level_id, duration_minutes, secret_code, start_at, end_at, max_attempts, is_published, is_active, devoir_number, semester, exam_questions(count)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
  ]);

  const rows: ExamRow[] = (exams ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    level_id: e.level_id,
    duration_minutes: e.duration_minutes,
    secret_code: e.secret_code,
    start_at: e.start_at,
    end_at: e.end_at,
    max_attempts: e.max_attempts,
    is_published: e.is_published,
    is_active: e.is_active,
    devoir_number: e.devoir_number,
    semester: e.semester,
    question_count: (e.exam_questions as unknown as { count: number }[])[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Examens</h1>
        <ExamDialog mode="create" levels={levels ?? []} trigger={<Button>+ Nouvel examen</Button>} />
      </div>
      <ExamsTable exams={rows} levels={levels ?? []} />
    </div>
  );
}
