"use client";
import { useState, useTransition } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/callback`,
      });
      // Supabase answers the same way for an unknown address, so nothing here
      // reveals whether an account exists. An error at this point is
      // operational — the send quota, or SMTP — and gets a generic message
      // rather than Supabase's English one.
      if (error) {
        setError("Envoi impossible pour le moment. Réessaie dans quelques minutes.");
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-5" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Si un compte existe pour <span className="font-semibold text-foreground">{email}</span>,
          un lien de réinitialisation vient d&apos;être envoyé. Pense à regarder les
          courriers indésirables — le lien est valable une seule fois.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Envoi…
          </>
        ) : (
          "Envoyer le lien"
        )}
      </Button>
    </form>
  );
}
