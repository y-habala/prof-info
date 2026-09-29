"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAccessCode, updateAccessCode } from "@/actions/access-codes";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type AccessCodeDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  initialValues?: { id: string; code: string; label: string | null; expiresAt: string | null };
};

export function AccessCodeDialog({ trigger, mode, initialValues }: AccessCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateAccessCode(initialValues.id, undefined, formData)
        : await createAccessCode(undefined, formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouveau code" : "Modifier le code"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code (4 chiffres)</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              maxLength={4}
              defaultValue={initialValues?.code}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Description</Label>
            <Input
              id="label"
              name="label"
              placeholder="ex. 3APIC - Groupe 1"
              defaultValue={initialValues?.label ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration (optionnel)</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={initialValues?.expiresAt?.slice(0, 10) ?? ""}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <SubmitButton label={mode === "create" ? "Créer" : "Enregistrer"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
