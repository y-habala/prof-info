import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié — Plateforme Informatique" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
            <KeyRound className="size-5" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground">
            Indique ton email : tu recevras un lien pour en choisir un nouveau.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {error ? (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Ce lien n&apos;est plus valide. Demandes-en un nouveau ci-dessous.
            </div>
          ) : null}
          <ForgotPasswordForm />
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
