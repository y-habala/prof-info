import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { signAccessSession, ACCESS_SESSION_COOKIE } from "@/lib/auth/access-session";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({ code: z.string().regex(/^\d{4}$/) });

const GENERIC_ERROR = "Code invalide ou expiré.";

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Only wrong codes count: a whole classroom shares one IP, and correct
  // entries must never lock it out. 30 wrong guesses per 10 min keeps
  // brute-forcing the 10 000 codes impractical.
  const failKey = `access:${ip}`;
  if (tooManyFailures(failKey)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });

  // Service role (bypassing RLS): access_codes is zero-grant to anon.
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("access_codes")
    .select("id, is_active")
    .eq("code", parsed.data.code)
    .maybeSingle();

  if (!row || !row.is_active) {
    recordFailure(failKey);
    // Deliberate small delay — not timing-constant, just enough to blunt
    // naive timing probes.
    await new Promise((r) => setTimeout(r, 150));
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = await signAccessSession({ codeId: row.id });
  const jar = await cookies();
  jar.set(ACCESS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
