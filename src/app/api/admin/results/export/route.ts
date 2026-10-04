import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { compareByClassAndNumber } from "@/lib/exam-attempt-sort";

export const runtime = "nodejs";

function formatDateTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR");
}

export async function GET(request: Request) {
  // Middleware already gates /api/admin/* on a Supabase Auth session, but
  // per this codebase's "never trust middleware alone" rule (see the admin
  // guard and the exam-session checks), re-verify here too.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  // Scoping to one class also switches the sheet to a minimal 4-column
  // format — this is meant to be handed to that class, not kept as the
  // admin's own full record, so it deliberately omits code/status/dates.
  const classFilter = searchParams.get("class");
  if (!id) {
    return new Response("Paramètres invalides.", { status: 400 });
  }

  let attemptsQuery = supabase
    .from("exam_attempts")
    .select(
      "student_first_name, student_name, student_number, student_class, student_code, score, max_score, percentage, submitted_at"
    )
    .eq("exam_id", id);
  if (classFilter) {
    attemptsQuery = attemptsQuery.eq("student_class", classFilter);
  }

  const [{ data: exam }, { data: attempts }] = await Promise.all([
    supabase.from("exams").select("title").eq("id", id).maybeSingle(),
    attemptsQuery,
  ]);
  if (!exam) {
    return new Response("Examen introuvable.", { status: 404 });
  }

  const sortedAttempts = [...(attempts ?? [])].sort(compareByClassAndNumber);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Résultats");

  if (classFilter) {
    sheet.columns = [
      { header: "Nom et Prénom", key: "fullName", width: 28 },
      { header: "N°", key: "number", width: 8 },
      { header: "Note", key: "score", width: 12 },
      { header: "Classe", key: "class", width: 14 },
    ];
    for (const a of sortedAttempts) {
      sheet.addRow({
        fullName: `${a.student_first_name} ${a.student_name}`,
        number: a.student_number ?? "",
        score: a.submitted_at ? `${a.score}/${a.max_score}` : "",
        class: a.student_class ?? "",
      });
    }
  } else {
    sheet.columns = [
      { header: "Prénom", key: "firstName", width: 18 },
      { header: "Nom", key: "name", width: 18 },
      { header: "N°", key: "number", width: 8 },
      { header: "Classe", key: "class", width: 14 },
      { header: "Code d'accès", key: "code", width: 12 },
      { header: "Score", key: "score", width: 10 },
      { header: "Sur", key: "maxScore", width: 8 },
      { header: "Pourcentage", key: "percentage", width: 12 },
      { header: "Statut", key: "status", width: 12 },
      { header: "Soumis le", key: "submittedAt", width: 20 },
    ];
    for (const a of sortedAttempts) {
      sheet.addRow({
        firstName: a.student_first_name,
        name: a.student_name,
        number: a.student_number ?? "",
        class: a.student_class ?? "",
        code: a.student_code ?? "",
        score: a.score,
        maxScore: a.max_score,
        percentage: a.percentage,
        status: a.submitted_at ? "Terminé" : "En cours",
        submittedAt: formatDateTime(a.submitted_at),
      });
    }
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = classFilter
    ? `resultats-examen-${id}-${classFilter}.xlsx`
    : `resultats-examen-${id}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
