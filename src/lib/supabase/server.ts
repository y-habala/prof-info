import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Server-side Supabase client bound to the current request's cookies.
// Reads use the anon key with RLS enforcing published-content visibility —
// anything sensitive (secrets, attempts, codes) is 0-grant to anon and goes
// through createAdminClient() instead.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (read-only context) — safe to ignore;
          // refresh happens via middleware.
        }
      },
    },
  });
}
