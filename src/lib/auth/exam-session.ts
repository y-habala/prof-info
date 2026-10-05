import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { ACCESS_SESSION_SECRET } from "@/lib/env";

export const EXAM_SESSION_COOKIE = "exam_attempt_session";

type ExamSession = { attemptId: string; modelId: string };

function getSecret(): Uint8Array {
  if (!ACCESS_SESSION_SECRET) throw new Error("ACCESS_SESSION_SECRET required.");
  return new TextEncoder().encode(ACCESS_SESSION_SECRET);
}

export async function signExamSession(payload: ExamSession, ttlSeconds: number) {
  return new SignJWT({ attemptId: payload.attemptId, modelId: payload.modelId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(getSecret());
}

export async function verifyExamSession(token: string | undefined): Promise<ExamSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.attemptId !== "string" || typeof payload.modelId !== "string") return null;
    return { attemptId: payload.attemptId, modelId: payload.modelId };
  } catch {
    return null;
  }
}
