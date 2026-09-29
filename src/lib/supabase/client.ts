import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client. Anon key only — never import the service-role key here.
 * Student pages should rarely need this directly (prefer Server Components);
 * kept for the admin UI where a client-side Supabase call is convenient.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
