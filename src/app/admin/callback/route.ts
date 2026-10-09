import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Landing point for the password-recovery link. Supabase sends the browser
// here with a one-time `code`; exchanging it writes the session cookies that
// let /admin/nouveau-mot-de-passe call updateUser. The destination is fixed
// rather than read from the query string, so the link can never be turned
// into an open redirect.
export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const failed = new URL("/admin/mot-de-passe-oublie?error=lien", origin);

  if (!code) return NextResponse.redirect(failed);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(failed);

  return NextResponse.redirect(new URL("/admin/nouveau-mot-de-passe", origin));
}
