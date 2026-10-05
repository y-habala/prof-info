import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyAccessSession, ACCESS_SESSION_COOKIE } from "@/lib/auth/access-session";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Student-protected routes — the whole student app sits behind the access
// code gate. The access page itself and the verify API must stay reachable.
const STUDENT_PROTECTED_PREFIXES = ["/courses", "/exercises", "/exam"];

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
    if (pathname === "/admin/login") return NextResponse.next();
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
