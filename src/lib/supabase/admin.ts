import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Import ONLY in server-only
 * code that must mediate access to a table with zero anon grants: access
 * code verification, exam code verification, server-side score writes,
 * and admin reads of attempts/results. The `server-only` import above
 * turns an accidental client-side import into a build failure.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
