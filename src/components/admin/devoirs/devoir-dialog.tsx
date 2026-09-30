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
import { DEVOIR_SESSIONS, DEVOIR_SESSION_LABELS } from "@/schemas/devoirs";
import { createDevoir, updateDevoir } from "@/actions/devoirs";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Level = { id: string; name: string };

type DevoirDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  levels: Level[];
  initialValues?: { id: string; title: string; levelId: string; session: string };
};

export function DevoirDialog({ trigger, mode, levels, initialValues }: DevoirDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateDevoir(initialValues.id, undefined, formData)
        : await createDevoir(undefined, formData);

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
          <DialogTitle>{mode === "create" ? "Nouveau devoir" : "Modifier le devoir"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="ex. Devoir 1"
              defaultValue={initialValues?.title}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="levelId">Niveau</Label>
            <select
              id="levelId"
              name="levelId"
              className={selectClass}
              defaultValue={initialValues?.levelId ?? ""}
              required
            >
              <option value="">—</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session">Session</Label>
            <select
              id="session"
              name="session"
              className={selectClass}
              defaultValue={initialValues?.session ?? DEVOIR_SESSIONS[0]}
              required
            >
              {DEVOIR_SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {DEVOIR_SESSION_LABELS[s]}
                </option>
              ))}
            </select>
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
