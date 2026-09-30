import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

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
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if ((type !== "exam" && type !== "exercise") || !id) {
    return new Response("Paramètres invalides.", { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Résultats");

  if (type === "exam") {
    const [{ data: exam }, { data: attempts }] = await Promise.all([
      supabase.from("exams").select("title").eq("id", id).maybeSingle(),
      supabase
        .from("exam_attempts")
        .select(
          "student_first_name, student_name, student_class, student_code, score, max_score, percentage, submitted_at"
        )
        .eq("exam_id", id)
        .order("started_at", { ascending: false }),
    ]);
    if (!exam) {
      return new Response("Examen introuvable.", { status: 404 });
    }

    sheet.columns = [
      { header: "Prénom", key: "firstName", width: 18 },
      { header: "Nom", key: "name", width: 18 },
      { header: "Classe", key: "class", width: 14 },
      { header: "Code d'accès", key: "code", width: 12 },
      { header: "Score", key: "score", width: 10 },
      { header: "Sur", key: "maxScore", width: 8 },
      { header: "Pourcentage", key: "percentage", width: 12 },
      { header: "Statut", key: "status", width: 12 },
      { header: "Soumis le", key: "submittedAt", width: 20 },
    ];
    for (const a of attempts ?? []) {
      sheet.addRow({
        firstName: a.student_first_name,
        name: a.student_name,
        class: a.student_class ?? "",
        code: a.student_code ?? "",
        score: a.score,
        maxScore: a.max_score,
        percentage: a.percentage,
        status: a.submitted_at ? "Terminé" : "En cours",
        submittedAt: formatDateTime(a.submitted_at),
      });
    }
  } else {
    const [{ data: exercise }, { data: attempts }] = await Promise.all([
      supabase.from("exercises").select("title").eq("id", id).maybeSingle(),
      supabase
        .from("exercise_attempts")
        .select("student_first_name, student_name, student_class, score, max_score, percentage, completed_at")
        .eq("exercise_id", id)
        .order("started_at", { ascending: false }),
    ]);
    if (!exercise) {
      return new Response("Exercice introuvable.", { status: 404 });
    }

    sheet.columns = [
      { header: "Prénom", key: "firstName", width: 18 },
      { header: "Nom", key: "name", width: 18 },
      { header: "Classe", key: "class", width: 14 },
      { header: "Score", key: "score", width: 10 },
      { header: "Sur", key: "maxScore", width: 8 },
      { header: "Pourcentage", key: "percentage", width: 12 },
      { header: "Statut", key: "status", width: 12 },
      { header: "Terminé le", key: "completedAt", width: 20 },
    ];
    for (const a of attempts ?? []) {
      sheet.addRow({
        firstName: a.student_first_name,
        name: a.student_name,
        class: a.student_class ?? "",
        score: a.score,
        maxScore: a.max_score,
        percentage: a.percentage,
        status: a.completed_at ? "Terminé" : "En cours",
        completedAt: formatDateTime(a.completed_at),
      });
    }
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `resultats-${type}-${id}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
