import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Lightweight endpoint: given a secret code, return only the level name.
// Does NOT reveal whether the code is valid — always returns 200.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.secretCode === "string" ? body.secretCode : "";

  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ levelName: null });
  }

  // Same wrong-code budget as /api/exam/verify, so this lookup can't be
  // used to try every code.
  const failKey = `exam-code:${clientIp(request)}`;
  if (tooManyFailures(failKey)) return NextResponse.json({ levelName: null });

  const admin = createAdminClient();
  const { data: model } = await admin
    .from("exam_models")
    .select("exams(levels(name))")
    .eq("secret_code", code)
    .maybeSingle();

  const levelName =
    (model?.exams as unknown as { levels: { name: string } | null } | null)
      ?.levels?.name ?? null;

  if (!model) recordFailure(failKey);
  return NextResponse.json({ levelName });
}
