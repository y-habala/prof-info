import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LinkIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe — Plateforme Informatique" };

// Reached from the recovery link, after /admin/callback has exchanged the
// one-time code for a session. Without that session there is nothing to
// update, so the page says so instead of bouncing to the login screen with
// no explanation.
export default async function NewPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
            {user ? <KeyRound className="size-5" strokeWidth={2.5} /> : <LinkIcon className="size-5" strokeWidth={2.5} />}
          </div>
          <h1 className="text-2xl font-bold">
            {user ? "Nouveau mot de passe" : "Lien invalide"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user
              ? "Choisis un mot de passe, puis tu seras connecté directement."
              : "Ce lien a expiré, a déjà servi, ou a été ouvert dans un autre navigateur."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {user ? (
            <ResetPasswordForm />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Ouvre le lien dans le même navigateur que celui où tu l&apos;as demandé, ou{" "}
              <Link href="/admin/mot-de-passe-oublie" className="font-medium text-primary hover:underline">
                demande un nouveau lien
              </Link>
              .
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/admin/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
