import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { examVerifySchema } from "@/schemas/exams";
import { getClientIp, isRateLimited, logAttempt, artificialDelay } from "@/lib/security/rate-limit";
import { ACCESS_SESSION_COOKIE, verifyAccessSession } from "@/lib/auth/access-session";
import { signExamSession, EXAM_SESSION_COOKIE, EXAM_GRACE_SECONDS } from "@/lib/auth/exam-session";

const GENERIC_ERROR = "Code invalide.";

export async function POST(request: Request) {
  await artificialDelay();

  // Middleware already required a platform session for this path, but per
  // the architecture doc's "never trust middleware alone" principle, an
  // admin-deactivated access code must stop working immediately — re-check
  // both the JWT and the underlying DB row here.
  const cookieStore = await cookies();
  const platformSession = await verifyAccessSession(cookieStore.get(ACCESS_SESSION_COOKIE)?.value);
  if (!platformSession) {
    return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: accessCode } = await admin
    .from("access_codes")
    .select("id, code")
    .eq("id", platformSession.accessCodeId)
    .eq("is_active", true)
    .maybeSingle();
  if (!accessCode) {
    return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = examVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { secretCode, studentName, studentFirstName, studentNumber, classNumber } = parsed.data;
  const ip = getClientIp(request);

  if (await isRateLimited("exam", ip, secretCode)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  // Wrong code and "right code but not published/active" must look
  // identical — distinguishing them would let someone scan the 4-digit
  // space for codes that exist. Timing/attempt checks below only run once
  // we already have a genuine match, so they're free to be specific.
  const { data: exam } = await admin
    .from("exams")
    .select("id, duration_minutes, start_at, end_at, max_attempts, levels(name)")
    .eq("secret_code", secretCode)
    .eq("is_published", true)
    .eq("is_active", true)
    .maybeSingle();

  if (!exam) {
    await logAttempt("exam", ip, secretCode, false);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
  await logAttempt("exam", ip, secretCode, true);

  const now = Date.now();
  if (exam.start_at && now < new Date(exam.start_at).getTime()) {
    return NextResponse.json({ error: "Cet examen n'est pas encore disponible." }, { status: 403 });
  }
  if (exam.end_at && now > new Date(exam.end_at).getTime()) {
    return NextResponse.json({ error: "Cet examen est terminé." }, { status: 403 });
  }

  // No student accounts, so this is matched on name+first name alone — a
  // documented, accepted limitation (see architecture doc).
  const { count } = await admin
    .from("exam_attempts")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", exam.id)
    .ilike("student_name", studentName)
    .ilike("student_first_name", studentFirstName);

  if ((count ?? 0) >= exam.max_attempts) {
    return NextResponse.json({ error: "Nombre maximum de tentatives atteint." }, { status: 403 });
  }

  const levelName = (exam.levels as unknown as { name: string } | null)?.name;
  const studentClass = levelName ? `${levelName}-${classNumber}` : String(classNumber);

  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .insert({
      exam_id: exam.id,
      student_name: studentName,
      student_first_name: studentFirstName,
      student_number: studentNumber || null,
      student_class: studentClass,
      student_code: accessCode.code,
      ip_address: ip,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  const expiresInSeconds = exam.duration_minutes * 60 + EXAM_GRACE_SECONDS;
  const token = await signExamSession({ attemptId: attempt.id, examId: exam.id }, expiresInSeconds);

  const response = NextResponse.json({ attemptId: attempt.id });
  response.cookies.set(EXAM_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: expiresInSeconds,
    path: "/",
  });
  return response;
}
