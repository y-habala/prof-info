import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The /admin/login page renders its own layout without this guard's
  // chrome; middleware handles the actual redirect for unauthenticated
  // users, this is just what to render for the (rare) case a Server
  // Component here runs without a user already having been redirected.
  if (!user) {
    return <>{children}</>;
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
