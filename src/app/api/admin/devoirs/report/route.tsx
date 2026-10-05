import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ClassReportDocument, type ClassReportData } from "@/lib/pdf/class-report";
import { SEMESTER_LABELS, type Semester } from "@/schemas/exams";
import { scoreOutOf20 } from "@/lib/grading";

// @react-pdf/renderer needs Node APIs (Buffer, fs for fonts) — not available
// on the Edge runtime middleware/routes elsewhere in this app default to.
export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const levelId = searchParams.get("level");
  const semester = searchParams.get("semester") as Semester | null;
  const devoirNumber = searchParams.get("devoir");
  const className = searchParams.get("class");
  if (!levelId || !semester || !devoirNumber || !className) {
    return new Response("Paramètres 'level', 'semester', 'devoir' et 'class' requis.", { status: 400 });
  }

  const admin = createAdminClient();
  // No separate "devoirs" row to key off — a devoir is however many exam
  // rows ("modèles", the teacher's own multi-version anti-cheating practice)
  // share this exact level + semester + devoir_number.
  const { data: matchingExams } = await admin
    .from("exams")
    .select("id")
    .eq("level_id", levelId)
    .eq("semester", semester)
    .eq("devoir_number", Number(devoirNumber));
  const examIds = (matchingExams ?? []).map((e) => e.id);
  if (examIds.length === 0) {
    return new Response("Aucun examen ne correspond à ce devoir.", { status: 404 });
  }

  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("student_name, student_first_name, score, max_score, submitted_at")
    .in("exam_id", examIds)
    .eq("student_class", className);

  const submitted = (attempts ?? []).filter((a) => a.submitted_at);
  const absentCount = (attempts ?? []).length - submitted.length;

  const data: ClassReportData = {
    examTitle: `Devoir ${devoirNumber} — ${SEMESTER_LABELS[semester]}`,
    className,
    students: submitted.map((a) => ({
      name: `${a.student_name} ${a.student_first_name}`,
      score: scoreOutOf20(Number(a.score), Number(a.max_score)),
    })),
    absentCount,
  };

  const buffer = await renderToBuffer(<ClassReportDocument data={data} />);
  const filename = `rapport-devoir-${devoirNumber}-${semester}-${className}.pdf`.replace(/\s+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
