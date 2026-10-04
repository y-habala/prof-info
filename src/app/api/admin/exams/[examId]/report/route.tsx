import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ClassReportDocument, type ClassReportData } from "@/lib/pdf/class-report";

// @react-pdf/renderer needs Node APIs (Buffer, fs for fonts) — not available
// on the Edge runtime middleware/routes elsewhere in this app default to.
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const { examId } = await params;
  const { searchParams } = new URL(request.url);
  const className = searchParams.get("class");
  if (!className) {
    return new Response("Paramètre 'class' requis.", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: exam } = await admin.from("exams").select("title").eq("id", examId).maybeSingle();
  if (!exam) {
    return new Response("Examen introuvable.", { status: 404 });
  }

  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("student_name, student_first_name, score, max_score, submitted_at")
    .eq("exam_id", examId)
    .eq("student_class", className);

  const submitted = (attempts ?? []).filter((a) => a.submitted_at);
  const absentCount = (attempts ?? []).length - submitted.length;

  const data: ClassReportData = {
    examTitle: exam.title,
    className,
    students: submitted.map((a) => ({
      name: `${a.student_name} ${a.student_first_name}`,
      score: a.max_score ? (a.score! / a.max_score) * 20 : 0,
    })),
    absentCount,
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
