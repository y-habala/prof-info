import { SignJWT, jwtVerify } from "jose";

export const ACCESS_SESSION_COOKIE = "platform_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8h — covers a school day

function getSecretKey() {
  const secret = process.env.ACCESS_SESSION_SECRET;
  if (!secret) {
    throw new Error("ACCESS_SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type AccessSessionPayload = {
  accessCodeId: string;
};

/** Signs a session token after a code has been verified server-side. */
export async function signAccessSession(payload: AccessSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Verifies a session token. Used in Middleware (fast/stateless — just
 * signature + expiry) AND re-checked against the DB by sensitive Route
 * Handlers/Server Actions, which is where an admin-deactivated code
 * actually takes effect (see architecture doc, Access Code strategy).
 */
export async function verifyAccessSession(
  token: string | undefined
): Promise<AccessSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.accessCodeId !== "string") return null;
    return { accessCodeId: payload.accessCodeId };
  } catch {
    return null;
  }
}

export const ACCESS_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
