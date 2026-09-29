import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MINUTES = 10;
const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_PER_CODE = 20; // a code is shared across a whole class — don't gate on IP alone

export type AccessScope = "platform" | "exam";

/** Extracts the real client IP behind Vercel's proxy; falls back for local dev. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

/** Returns true if this IP or code has hit the failed-attempt budget. */
export async function isRateLimited(
  scope: AccessScope,
  ipAddress: string,
  code: string
): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const [byIp, byCode] = await Promise.all([
    admin
      .from("access_attempts")
      .select("id", { count: "exact", head: true })
      .eq("scope", scope)
      .eq("ip_address", ipAddress)
      .eq("success", false)
      .gte("created_at", since),
    admin
      .from("access_attempts")
      .select("id", { count: "exact", head: true })
      .eq("scope", scope)
      .eq("code_attempted", code)
      .eq("success", false)
      .gte("created_at", since),
  ]);

  return (
    (byIp.count ?? 0) >= MAX_FAILURES_PER_IP || (byCode.count ?? 0) >= MAX_FAILURES_PER_CODE
  );
}

export async function logAttempt(
  scope: AccessScope,
  ipAddress: string,
  code: string,
  success: boolean
) {
  const admin = createAdminClient();
  await admin
    .from("access_attempts")
    .insert({ scope, ip_address: ipAddress, code_attempted: code, success });
}

/** Small fixed delay on every verify call — cheap, caps guesses/second, invisible to a human. */
export function artificialDelay() {
  return new Promise((resolve) => setTimeout(resolve, 300));
}
