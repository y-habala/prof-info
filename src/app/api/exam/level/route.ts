import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Lightweight endpoint: given a secret code, return only the level name.
// Does NOT reveal whether the code is valid — always returns 200.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.secretCode === "string" ? body.secretCode : "";

  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ levelName: null });
  }

  const admin = createAdminClient();
  const { data: model } = await admin
    .from("exam_models")
    .select("exams(levels(name))")
    .eq("secret_code", code)
    .maybeSingle();

  const levelName =
    (model?.exams as unknown as { levels: { name: string } | null } | null)
      ?.levels?.name ?? null;

  return NextResponse.json({ levelName });
}
