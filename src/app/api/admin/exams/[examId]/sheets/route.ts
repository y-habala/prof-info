import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { loadPdfLogo } from "@/lib/pdf/logo";
import { buildAnswerSheetPdf } from "@/lib/pdf/answer-sheet-build";

export const runtime = "nodejs";
// One PDF per copy: a full class takes a few seconds to render.
export const maxDuration = 300;

// Every corrected answer sheet of an exam (optionally one class) in a ZIP.
export async function GET(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { examId } = await params;
  const classFilter = new URL(request.url).searchParams.get("class");
  const admin = createAdminClient();

  const [{ data: exam }, { data: models }] = await Promise.all([
    admin.from("exams").select("title").eq("id", examId).maybeSingle(),
    admin.from("exam_models").select("id").eq("exam_id", examId),
  ]);
  if (!exam) return new Response("Examen introuvable.", { status: 404 });
  const modelIds = (models ?? []).map((m) => m.id);
  if (modelIds.length === 0) return new Response("Aucune copie.", { status: 404 });

  let query = admin
    .from("exam_attempts")
    .select("id")
    .in("exam_model_id", modelIds)
    .not("submitted_at", "is", null);
  if (classFilter) query = query.eq("student_class", classFilter);
  const { data: attempts } = await query;
  if (!attempts || attempts.length === 0) return new Response("Aucune copie rendue.", { status: 404 });

  const settings = await getSettings();
  const logo = await loadPdfLogo(settings.exam_logo_url);
  const zip = new JSZip();
  const taken = new Set<string>();
  // Sequential on purpose: rendering is CPU-bound and memory-hungry.
  for (const a of attempts) {
    const sheet = await buildAnswerSheetPdf(admin, a.id, settings, logo);
    if (!sheet) continue;
    let name = sheet.filename;
    for (let n = 2; taken.has(name); n++) name = sheet.filename.replace(/\.pdf$/, `_${n}.pdf`);
    taken.add(name);
    zip.file(name, sheet.buffer);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const base = [exam.title, classFilter].filter(Boolean).join("_").trim().replace(/[\s/\:*?"<>|]+/g, "-");
  const ascii = base.normalize("NFD").replace(/[^\x20-\x7e]/g, "") || "copies";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Copies_${ascii}.zip"; filename*=UTF-8''${encodeURIComponent(`Copies_${base}.zip`)}`,
    },
  });
}
