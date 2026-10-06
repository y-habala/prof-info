import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClassReportDocument, type ClassReportData } from "@/lib/pdf/class-report";
import { getSettings } from "@/lib/settings";
import { scoreOutOf20 } from "@/lib/grading";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { examId } = await params;
  const { searchParams } = new URL(request.url);
  const className = searchParams.get("class");
  if (!className) return new Response("Paramètre 'class' requis.", { status: 400 });

  const admin = createAdminClient();
  const { data: exam } = await admin.from("exams").select("title").eq("id", examId).maybeSingle();
  if (!exam) return new Response("Examen introuvable.", { status: 404 });

  // Aggregate attempts across ALL models of this exam, filtered to the class.
  const { data: models } = await admin.from("exam_models").select("id").eq("exam_id", examId);
  const modelIds = (models ?? []).map((m) => m.id);
  if (modelIds.length === 0) {
    return new Response("Aucun modèle pour cet examen.", { status: 404 });
  }

  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("student_name, student_first_name, score, max_score, submitted_at")
    .in("exam_model_id", modelIds)
    .eq("student_class", className);

  const submitted = (attempts ?? []).filter((a) => a.submitted_at);
  const absentCount = (attempts ?? []).length - submitted.length;

  const settings = await getSettings();
  const data: ClassReportData = {
    examTitle: exam.title,
    className,
    students: submitted.map((a) => ({
      name: `${a.student_name} ${a.student_first_name}`,
      score: scoreOutOf20(Number(a.score ?? 0), Number(a.max_score ?? 0)),
    })),
    absentCount,
    settings: {
      teacherName: settings.teacher_name,
      institution: settings.institution,
      academie: settings.academie,
      direction: settings.direction,
    },
  };

  const buffer = await renderToBuffer(<ClassReportDocument data={data} />);
  const filename = `rapport-${exam.title}-${className}.pdf`.replace(/\s+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
