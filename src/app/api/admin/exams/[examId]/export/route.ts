import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { compareByClassAndNumber } from "@/lib/exam-attempt-sort";
import { scoreOutOf20 } from "@/lib/grading";

export const runtime = "nodejs";

function formatDateTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR");
}

export async function GET(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  // Admin auth check — middleware already gates /api/admin/*, but defense
  // in depth per architecture principle.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { examId } = await params;
  const { searchParams } = new URL(request.url);
  const classFilter = searchParams.get("class");

  const admin = createAdminClient();
  const { data: exam } = await admin.from("exams").select("title").eq("id", examId).maybeSingle();
  if (!exam) return new Response("Examen introuvable.", { status: 404 });

  const { data: models } = await admin.from("exam_models").select("id, label").eq("exam_id", examId);
  const modelLabelById = new Map((models ?? []).map((m) => [m.id, m.label]));
  const modelIds = (models ?? []).map((m) => m.id);
  if (modelIds.length === 0) {
    return new Response("Aucun modèle pour cet examen.", { status: 404 });
  }

  let query = admin
    .from("exam_attempts")
    .select(
      "exam_model_id, student_name, student_first_name, student_number, student_class, score, max_score, started_at, submitted_at"
    )
    .in("exam_model_id", modelIds);
  if (classFilter) query = query.eq("student_class", classFilter);

  const { data: attempts } = await query;
  const sorted = (attempts ?? []).sort(compareByClassAndNumber);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(classFilter ?? "Résultats");

  if (classFilter) {
    // Scoped export — the sheet is meant to be handed to that class.
    sheet.columns = [
      { header: "Nom et Prénom", key: "fullName", width: 32 },
      { header: "N°", key: "number", width: 8 },
      { header: "Note", key: "score", width: 10 },
      { header: "Classe", key: "class", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const a of sorted) {
      sheet.addRow({
        fullName: `${a.student_name} ${a.student_first_name}`.trim(),
        number: a.student_number ?? "",
        score: a.submitted_at ? scoreOutOf20(Number(a.score ?? 0), Number(a.max_score ?? 0)) : null,
        class: a.student_class ?? "",
      });
    }
    // Force 2-decimal display on the Note column — real Excel number, still
    // sortable/usable in formulas.
    sheet.getColumn("score").numFmt = "0.00";
  } else {
    // Full export — admin's own record of everything.
    sheet.columns = [
      { header: "Prénom", key: "firstName", width: 18 },
      { header: "Nom", key: "name", width: 18 },
      { header: "N°", key: "number", width: 8 },
      { header: "Classe", key: "class", width: 14 },
      { header: "Modèle", key: "model", width: 10 },
      { header: "Note /20", key: "score20", width: 12 },
      { header: "Score brut", key: "scoreRaw", width: 12 },
      { header: "Max", key: "max", width: 10 },
      { header: "Démarré", key: "started", width: 20 },
      { header: "Soumis", key: "submitted", width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const a of sorted) {
      sheet.addRow({
        firstName: a.student_first_name,
        name: a.student_name,
        number: a.student_number ?? "",
        class: a.student_class ?? "",
        model: modelLabelById.get(a.exam_model_id)?.toUpperCase() ?? "?",
        score20: a.submitted_at ? scoreOutOf20(Number(a.score ?? 0), Number(a.max_score ?? 0)) : null,
        scoreRaw: a.score ?? "",
        max: a.max_score ?? "",
        started: formatDateTime(a.started_at),
        submitted: formatDateTime(a.submitted_at),
      });
    }
    sheet.getColumn("score20").numFmt = "0.00";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `resultats-${exam.title}${classFilter ? `-${classFilter}` : ""}.xlsx`.replace(/\s+/g, "-");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
