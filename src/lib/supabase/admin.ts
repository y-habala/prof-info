import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/env";

// Service-role client — bypasses RLS entirely. Used ONLY from server-side
// code gated by its own auth check (admin auth for /admin routes, platform-
// session cookie for /api/exam/*, etc.). The "server-only" import at the top
// makes this a hard build error if ever imported from a client component.
export function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin client.");
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
