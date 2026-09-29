import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signAccessSession, ACCESS_SESSION_COOKIE, ACCESS_SESSION_MAX_AGE } from "@/lib/auth/access-session";
import { accessCodeSchema } from "@/schemas/access";
import { getClientIp, isRateLimited, logAttempt, artificialDelay } from "@/lib/security/rate-limit";

const GENERIC_ERROR = "Code invalide ou expiré.";

export async function POST(request: Request) {
  await artificialDelay();

  const body = await request.json().catch(() => null);
  const parsed = accessCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { code } = parsed.data;
  const ip = getClientIp(request);

  if (await isRateLimited("platform", ip, code)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: accessCode } = await admin
    .from("access_codes")
    .select("id")
    .eq("code", code)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .maybeSingle();

  if (!accessCode) {
    await logAttempt("platform", ip, code, false);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await logAttempt("platform", ip, code, true);

  const token = await signAccessSession({ accessCodeId: accessCode.id });
  const response = NextResponse.json({ success: true });
  response.cookies.set(ACCESS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ACCESS_SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
