import "server-only";

// In-memory sliding-window rate limiter — intentionally simple, suitable for
// the single-school scale this platform targets. Replaces the v1 access_attempts
// table (which added DB round-trips to every access attempt for no real gain
// at this scale). On a serverless cold start the window resets, which is a
// deliberate tradeoff — the dominant attack we care about is a single
// burst from one IP, which is already caught within one warm instance's
// lifetime.

type Hit = { timestamp: number };
const buckets = new Map<string, Hit[]>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { max, windowSeconds }: { max: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const hits = (buckets.get(key) ?? []).filter((h) => h.timestamp > windowStart);
  if (hits.length >= max) {
    const oldest = hits[0].timestamp;
    return { ok: false, retryAfterSeconds: Math.ceil((oldest + windowSeconds * 1000 - now) / 1000) };
  }
  hits.push({ timestamp: now });
  buckets.set(key, hits);
  return { ok: true };
}

// Failure-only limiting for code entry: a whole classroom shares one IP, so
// correct codes must never count — only wrong guesses do. Check first, and
// record only when the code turned out to be wrong.
const FAILS = { max: 30, windowSeconds: 600 };

export function tooManyFailures(key: string): boolean {
  const windowStart = Date.now() - FAILS.windowSeconds * 1000;
  const hits = (buckets.get(key) ?? []).filter((h) => h.timestamp > windowStart);
  buckets.set(key, hits);
  return hits.length >= FAILS.max;
}

export function recordFailure(key: string): void {
  const hits = buckets.get(key) ?? [];
  hits.push({ timestamp: Date.now() });
  buckets.set(key, hits);
}

// Convenience for API routes — reads x-forwarded-for first, then a fallback.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
