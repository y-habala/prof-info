import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DevoirReportDocument, type DevoirReportData } from "@/lib/pdf/devoir-report";
import { DEVOIR_SESSION_LABELS, type DevoirSession } from "@/schemas/devoirs";

// @react-pdf/renderer needs Node APIs (Buffer, fs for fonts) — not available
// on the Edge runtime middleware/routes elsewhere in this app default to.
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ devoirId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const { devoirId } = await params;
  const { searchParams } = new URL(request.url);
  const className = searchParams.get("class");
  if (!className) {
    return new Response("Paramètre 'class' requis.", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: devoir } = await admin
    .from("devoirs")
    .select("title, session, levels(name)")
    .eq("id", devoirId)
    .maybeSingle();

  if (!devoir) {
    return new Response("Devoir introuvable.", { status: 404 });
  }

  const { data: exams } = await admin.from("exams").select("id").eq("devoir_id", devoirId);
  const examIds = (exams ?? []).map((e) => e.id);

  const { data: attempts } =
    examIds.length > 0
      ? await admin
          .from("exam_attempts")
          .select("student_name, student_first_name, score, max_score, submitted_at")
          .in("exam_id", examIds)
          .eq("student_class", className)
      : { data: [] };

  const submitted = (attempts ?? []).filter((a) => a.submitted_at);
  const absentCount = (attempts ?? []).length - submitted.length;

  const data: DevoirReportData = {
    devoirTitle: devoir.title,
    sessionLabel: DEVOIR_SESSION_LABELS[devoir.session as DevoirSession],
    className,
    students: submitted.map((a) => ({
      name: `${a.student_name} ${a.student_first_name}`,
      score: a.max_score ? (a.score! / a.max_score) * 20 : 0,
    })),
    absentCount,
  };

  const buffer = await renderToBuffer(<DevoirReportDocument data={data} />);
  const filename = `rapport-${devoir.title}-${className}.pdf`.replace(/\s+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
