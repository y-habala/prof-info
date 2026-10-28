import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ClassReportDocument } from "@/lib/pdf/class-report";
import { getSettings } from "@/lib/settings";
import { loadPdfLogo } from "@/lib/pdf/logo";
import { CONTROL_LABELS, CONTROL_COUNT } from "@/lib/massar/cc-constants";

export const runtime = "nodejs";

// Class report built from the contrôle continu grades: the roster and the
// absences come from the Massar file, the grades from what was entered.
export async function GET(request: Request, { params }: { params: Promise<{ sheetId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { sheetId } = await params;
  const control = Number(new URL(request.url).searchParams.get("control"));
  if (!Number.isInteger(control) || control < 1 || control > CONTROL_COUNT) {
    return new Response("Paramètre 'control' invalide.", { status: 400 });
  }

  const [{ data: sheet }, { data: students }, settings] = await Promise.all([
    supabase
      .from("cc_sheets")
      .select("class_name, school_year, session_label")
      .eq("id", sheetId)
      .maybeSingle(),
    supabase
      .from("cc_students")
      .select(`full_name, row_number, note${control}, abs${control}`)
      .eq("sheet_id", sheetId)
      .order("row_number"),
    getSettings(),
  ]);
  if (!sheet) return new Response("Classe introuvable.", { status: 404 });

  const rows = (students ?? []) as unknown as Record<string, unknown>[];
  const controlLabel = CONTROL_LABELS[control - 1];
  const buffer = await renderToBuffer(
    <ClassReportDocument
      data={{
        className: sheet.class_name,
        schoolYear: sheet.school_year,
        sessionLabel: sheet.session_label,
        controlLabel,
        controlNumber: control <= 3 ? String(control) : controlLabel,
        students: rows.map((r) => ({
          name: String(r.full_name),
          score: r[`note${control}`] == null ? null : Number(r[`note${control}`]),
          absence: (r[`abs${control}`] as string | null) ?? null,
        })),
        logo: await loadPdfLogo(settings.exam_logo_url),
        settings: {
          teacherName: settings.teacher_name,
          academieAr: settings.academie_ar,
          directionAr: settings.direction_ar,
        },
      }}
    />
  );

  const filename = `rapport-${sheet.class_name}-${sheet.session_label}-${controlLabel}.pdf`.replace(/[^\w.\-]+/g, "-");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
