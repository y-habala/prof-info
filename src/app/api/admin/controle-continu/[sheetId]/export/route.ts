import { createClient } from "@/lib/supabase/server";
import { buildMassarCcFile, MassarFileError } from "@/lib/massar/cc-file";

export const runtime = "nodejs";

type StudentRow = {
  row_number: number;
  note1: number | null;
  note2: number | null;
  note3: number | null;
  note4: number | null;
  abs1: string | null;
  abs2: string | null;
  abs3: string | null;
  abs4: string | null;
};

export async function GET(_request: Request, { params }: { params: Promise<{ sheetId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { sheetId } = await params;
  const [{ data: sheet }, { data: students }] = await Promise.all([
    supabase.from("cc_sheets").select("source_file_name, source_file_b64").eq("id", sheetId).maybeSingle(),
    supabase
      .from("cc_students")
      .select("row_number, note1, note2, note3, note4, abs1, abs2, abs3, abs4")
      .eq("sheet_id", sheetId),
  ]);
  if (!sheet) return new Response("Classe introuvable.", { status: 404 });

  const num = (v: number | string | null) => (v == null ? null : Number(v));
  try {
    const file = await buildMassarCcFile(
      Buffer.from(sheet.source_file_b64, "base64"),
      ((students ?? []) as StudentRow[]).map((s) => ({
        rowNumber: s.row_number,
        notes: [num(s.note1), num(s.note2), num(s.note3), num(s.note4)],
        absences: [s.abs1, s.abs2, s.abs3, s.abs4],
      }))
    );
    const name = sheet.source_file_name.replace(/[^\w.\-]/g, "_");
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (e) {
    if (e instanceof MassarFileError) return new Response(e.message, { status: 422 });
    throw e;
  }
}
