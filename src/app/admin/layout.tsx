import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">Administration</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
