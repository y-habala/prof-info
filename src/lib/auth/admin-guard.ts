import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Shared guard for every /admin page + /api/admin route. Never trust the
// middleware alone (per architecture doc §6) — this re-checks on every
// request against the real auth cookie.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}
