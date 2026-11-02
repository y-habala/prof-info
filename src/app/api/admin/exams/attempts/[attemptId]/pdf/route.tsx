import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { loadPdfLogo } from "@/lib/pdf/logo";
import { buildAnswerSheetPdf } from "@/lib/pdf/answer-sheet-build";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  // Admin-only — same reasoning as v1: the answer sheet shows full
  // correction (right answers for wrong student answers) and must never
  // be reachable by the student themselves.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé.", { status: 401 });

  const { attemptId } = await params;
  const settings = await getSettings();
  const logo = await loadPdfLogo(settings.exam_logo_url);
  const sheet = await buildAnswerSheetPdf(createAdminClient(), attemptId, settings, logo);
  if (!sheet) return new Response("Tentative introuvable.", { status: 404 });

  return new Response(new Uint8Array(sheet.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sheet.filename}"`,
    },
  });
}
