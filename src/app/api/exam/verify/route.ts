import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { examVerifySchema } from "@/schemas/exams";
import { signExamSession, EXAM_SESSION_COOKIE } from "@/lib/auth/exam-session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const GENERIC_ERROR = "Code invalide ou examen indisponible.";

const EXAM_GRACE_SECONDS = 5 * 60;

export async function POST(request: Request) {
  const ip = clientIp(request);

  const limited = rateLimit(`exam-verify:${ip}`, { max: 15, windowSeconds: 600 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  const parsed = examVerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });

  const admin = createAdminClient();

  // Resolve the model by secret code → the parent exam
  const { data: model } = await admin
    .from("exam_models")
    .select("id, exam_id, exams(id, title, duration_minutes, start_at, end_at, max_attempts, is_published, is_active, level_id, levels(name))")
    .eq("secret_code", parsed.data.secretCode)
    .maybeSingle();

  if (!model) {
    await new Promise((r) => setTimeout(r, 150));
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const exam = model.exams as unknown as {
    id: string;
    title: string;
    duration_minutes: number;
    start_at: string | null;
    end_at: string | null;
    max_attempts: number;
    is_published: boolean;
    is_active: boolean;
    level_id: string | null;
    levels: { name: string } | null;
  } | null;

  if (!exam || !exam.is_published || !exam.is_active) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const now = Date.now();
  if (exam.start_at && new Date(exam.start_at).getTime() > now) {
    return NextResponse.json({ error: "L'examen n'est pas encore ouvert." }, { status: 401 });
  }
  if (exam.end_at && new Date(exam.end_at).getTime() < now) {
    return NextResponse.json({ error: "L'examen est terminé." }, { status: 401 });
  }

  const studentClass = parsed.data.studentClass;

  // Enforce max_attempts: count submitted attempts by this student (name+firstname)
  // against ANY model of this exam (so the student can't just switch models to
  // reset their count).
  const { data: siblingModels } = await admin.from("exam_models").select("id").eq("exam_id", exam.id);
  const modelIds = (siblingModels ?? []).map((m) => m.id);
  if (modelIds.length > 0 && exam.max_attempts > 0) {
    const { count } = await admin
      .from("exam_attempts")
      .select("*", { count: "exact", head: true })
      .in("exam_model_id", modelIds)
      .not("submitted_at", "is", null)
      .ilike("student_first_name", parsed.data.studentFirstName.trim())
      .ilike("student_name", parsed.data.studentName.trim());
    if ((count ?? 0) >= exam.max_attempts) {
      return NextResponse.json({ error: "Nombre maximum de tentatives atteint." }, { status: 401 });
    }
  }

  // Create the attempt
  const { data: attempt, error: insertErr } = await admin
    .from("exam_attempts")
    .insert({
      exam_model_id: model.id,
      student_first_name: parsed.data.studentFirstName.trim(),
      student_name: parsed.data.studentName.trim(),
      student_class: studentClass,
      ip_address: ip,
    })
    .select("id")
    .single();

  if (insertErr || !attempt) {
    return NextResponse.json({ error: "Impossible de démarrer l'examen." }, { status: 500 });
  }

  const ttlSeconds = exam.duration_minutes * 60 + EXAM_GRACE_SECONDS;
  const token = await signExamSession({ attemptId: attempt.id, modelId: model.id }, ttlSeconds);
  const jar = await cookies();
  jar.set(EXAM_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });

  return NextResponse.json({ attemptId: attempt.id });
}
