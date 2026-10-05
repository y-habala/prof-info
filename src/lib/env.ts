// Read + validate required env vars once at module load. Any missing value is
// a hard error — fail fast at boot rather than silently crashing on first
// Supabase call. Public NEXT_PUBLIC_* vars are also exported typed so client
// components use the same constants, not duplicate `process.env.NEXT_PUBLIC_*`
// lookups scattered everywhere.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}. See .env.local.`);
  }
  return value;
}

export const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Server-only — never ship these to the browser. The check lives in the
// server-only files that read them; here we leave them optional at the type
// level so this module can also be imported from client code safely.
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const ACCESS_SESSION_SECRET = process.env.ACCESS_SESSION_SECRET;
