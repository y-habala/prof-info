import { SignJWT, jwtVerify } from "jose";

export const EXAM_SESSION_COOKIE = "exam_attempt_session";

// Shared by /api/exam/verify (cookie expiry) and /api/exam/[id]/submit
// (deadline check) so both use the exact same cutoff — covers network
// latency on the auto-submit-at-zero call, not an intentional extension.
export const EXAM_GRACE_SECONDS = 5 * 60;

function getSecretKey() {
  const secret = process.env.ACCESS_SESSION_SECRET;
  if (!secret) {
    throw new Error("ACCESS_SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type ExamSessionPayload = {
  attemptId: string;
  examId: string;
};

/**
 * Signs a per-attempt cookie right after /api/exam/verify creates the
 * exam_attempts row. Expiry is tied to the attempt's own time budget
 * (duration_minutes + a short grace), never an arbitrary session length —
 * see architecture doc, Access Code strategy §B.
 */
export async function signExamSession(payload: ExamSessionPayload, expiresInSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecretKey());
}

export async function verifyExamSession(token: string | undefined): Promise<ExamSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.attemptId !== "string" || typeof payload.examId !== "string") return null;
    return { attemptId: payload.attemptId, examId: payload.examId };
  } catch {
    return null;
  }
}
