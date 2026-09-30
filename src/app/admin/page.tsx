import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function countRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  onlyPublished = false
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (onlyPublished) query = query.eq("is_published", true);
  const { count } = await query;
  return count ?? 0;
}

function StatCard({ label, value, sublabel }: { label: string; value: number | string; sublabel?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold">{value}</p>
        {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
      </CardContent>
    </Card>
  );
}

type RecentAttempt = {
  id: string;
  type: "exercice" | "examen";
  title: string;
  studentName: string;
  studentFirstName: string;
  percentage: number | null;
  date: string;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    levelsCount,
    sessionsCount,
    sessionsPublished,
    exercisesCount,
    exercisesPublished,
    htmlPagesCount,
    htmlPagesPublished,
    examsCount,
    examsPublished,
    announcementsCount,
    announcementsPublished,
    activeAccessCodesCount,
    exerciseAttemptsCount,
    examAttemptsCount,
  ] = await Promise.all([
    countRows(supabase, "levels"),
    countRows(supabase, "sessions"),
    countRows(supabase, "sessions", true),
    countRows(supabase, "exercises"),
    countRows(supabase, "exercises", true),
    countRows(supabase, "html_pages"),
    countRows(supabase, "html_pages", true),
    countRows(supabase, "exams"),
    countRows(supabase, "exams", true),
    countRows(supabase, "announcements"),
    countRows(supabase, "announcements", true),
    supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("is_active", true).then((r) => r.count ?? 0),
    countRows(supabase, "exercise_attempts"),
    countRows(supabase, "exam_attempts"),
  ]);

  const [{ data: recentExercise }, { data: recentExam }, { data: avgExercise }, { data: avgExam }] =
    await Promise.all([
      supabase
        .from("exercise_attempts")
        .select("id, student_name, student_first_name, percentage, completed_at, exercises(title)")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(8),
      supabase
        .from("exam_attempts")
        .select("id, student_name, student_first_name, percentage, submitted_at, exams(title)")
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(8),
      supabase.from("exercise_attempts").select("percentage").not("percentage", "is", null),
      supabase.from("exam_attempts").select("percentage").not("percentage", "is", null),
    ]);

  const recent: RecentAttempt[] = [
    ...(recentExercise ?? []).map((a) => ({
      id: a.id,
      type: "exercice" as const,
      title: (a.exercises as unknown as { title: string } | null)?.title ?? "",
      studentName: a.student_name,
      studentFirstName: a.student_first_name,
      percentage: a.percentage,
      date: a.completed_at as string,
    })),
    ...(recentExam ?? []).map((a) => ({
      id: a.id,
      type: "examen" as const,
      title: (a.exams as unknown as { title: string } | null)?.title ?? "",
      studentName: a.student_name,
      studentFirstName: a.student_first_name,
      percentage: a.percentage,
      date: a.submitted_at as string,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const allPercentages = [
    ...(avgExercise ?? []).map((a) => a.percentage as number),
    ...(avgExam ?? []).map((a) => a.percentage as number),
  ];
  const overallAverage =
    allPercentages.length > 0
      ? Math.round((allPercentages.reduce((sum, p) => sum + p, 0) / allPercentages.length) * 10) / 10
      : null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Niveaux" value={levelsCount} />
        <StatCard label="Séances" value={sessionsPublished} sublabel={`sur ${sessionsCount} au total`} />
        <StatCard label="Exercices" value={exercisesPublished} sublabel={`sur ${exercisesCount} au total`} />
        <StatCard label="Activités HTML" value={htmlPagesPublished} sublabel={`sur ${htmlPagesCount} au total`} />
        <StatCard label="Examens" value={examsPublished} sublabel={`sur ${examsCount} au total`} />
        <StatCard label="Actualités" value={announcementsPublished} sublabel={`sur ${announcementsCount} au total`} />
        <StatCard label="Codes d'accès actifs" value={activeAccessCodesCount} />
        <StatCard
          label="Moyenne générale"
          value={overallAverage !== null ? `${overallAverage} %` : "—"}
          sublabel="Exercices + examens"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Tentatives d'exercices" value={exerciseAttemptsCount} />
        <StatCard label="Tentatives d'examens" value={examAttemptsCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground">Aucune activité pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((a) => (
                <div key={`${a.type}-${a.id}`} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{a.type === "exercice" ? "Exercice" : "Examen"}</Badge>
                    <span>
                      {a.studentFirstName} {a.studentName}
                    </span>
                    <span className="text-muted-foreground">— {a.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{a.percentage !== null ? `${a.percentage} %` : "—"}</span>
                    <span>{new Date(a.date).toLocaleString("fr-FR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
