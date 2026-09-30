import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_SESSION_COOKIE, verifyAccessSession } from "@/lib/auth/access-session";

const STUDENT_PROTECTED_PREFIXES = [
  "/courses",
  "/exercises",
  "/activities",
  "/exam",
  "/actualites",
  "/api/exercise",
  "/api/exam",
];

function isStudentProtectedPath(pathname: string) {
  // The PDF route serves two legitimate callers — the student (platform +
  // exam-attempt session) and the admin (Supabase Auth only, reviewing from
  // /admin/results, who was never issued a platform_session) — and enforces
  // that itself. Gating it here too would block the admin path whenever
  // their browser never happened to also visit /access.
  if (pathname.startsWith("/api/exam/") && pathname.endsWith("/pdf")) return false;
  return pathname === "/" || STUDENT_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

async function handleAdminRoute(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (not getSession()) re-validates against Supabase Auth rather
  // than trusting the cookie's own claims — required when the result gates
  // access, per Supabase's SSR guidance.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminLogin = request.nextUrl.pathname === "/admin/login";

  if (!isAdminLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isAdminLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

async function handleStudentRoute(request: NextRequest) {
  const token = request.cookies.get(ACCESS_SESSION_COOKIE)?.value;
  const session = await verifyAccessSession(token);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/access";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdminRoute(request);
  }

  if (isStudentProtectedPath(pathname)) {
    return handleStudentRoute(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/courses/:path*",
    "/exercises/:path*",
    "/activities/:path*",
    "/exam/:path*",
    "/actualites/:path*",
    "/api/exercise/:path*",
    "/api/exam/:path*",
    "/api/admin/:path*",
  ],
};
