import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Connexion admin — Plateforme Informatique" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
            <Lock className="size-5" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground">Connexion réservée à l&apos;enseignant.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
