import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { ACCESS_SESSION_SECRET } from "@/lib/env";

export const ACCESS_SESSION_COOKIE = "platform_session";

type AccessSession = { codeId: string };

function getSecret(): Uint8Array {
  if (!ACCESS_SESSION_SECRET) {
    throw new Error("ACCESS_SESSION_SECRET is required (see .env.local).");
  }
  return new TextEncoder().encode(ACCESS_SESSION_SECRET);
}

export async function signAccessSession(payload: AccessSession, ttlSeconds = 8 * 60 * 60) {
  return new SignJWT({ codeId: payload.codeId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(getSecret());
}

export async function verifyAccessSession(token: string | undefined): Promise<AccessSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.codeId !== "string") return null;
    return { codeId: payload.codeId };
  } catch {
    return null;
  }
}
