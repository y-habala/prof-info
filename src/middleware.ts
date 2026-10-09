import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyAccessSession, ACCESS_SESSION_COOKIE } from "@/lib/auth/access-session";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Student-protected routes — the whole student app sits behind the access
// code gate. The access page itself and the verify API must stay reachable.
const STUDENT_PROTECTED_PREFIXES = ["/courses", "/exercises", "/exam"];

// Admin paths that must stay reachable without a session: the login screen
// and the whole password-recovery path. /admin/nouveau-mot-de-passe is in the
// list too — it renders its own "lien invalide" message when the recovery
// code never produced a session, which is clearer than a silent bounce to
// the login screen.
const ADMIN_PUBLIC_PATHS = new Set([
  "/admin/login",
  "/admin/mot-de-passe-oublie",
  "/admin/nouveau-mot-de-passe",
  "/admin/callback",
]);

function isStudentProtectedPath(pathname: string) {
  // PDF download of an attempt (admin-only, via Supabase Auth, no platform
  // session) is handled in Session 3 — kept out of the student gate here.
  if (pathname.startsWith("/api/exam/") && pathname.endsWith("/pdf")) return false;
  return pathname === "/" || STUDENT_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes — Supabase Auth session.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (ADMIN_PUBLIC_PATHS.has(pathname)) return NextResponse.next();
    const res = NextResponse.next();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Student routes — JWT platform session (our own cookie).
  if (isStudentProtectedPath(pathname)) {
    const token = req.cookies.get(ACCESS_SESSION_COOKIE)?.value;
    const session = await verifyAccessSession(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/access";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/courses/:path*",
    "/exercises/:path*",
    "/exam/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/exam/:path*",
  ],
};
