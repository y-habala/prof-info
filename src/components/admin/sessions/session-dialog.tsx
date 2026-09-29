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
import { createSession, updateSession } from "@/actions/sessions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type SessionDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  sequenceId: string;
  unitId: string;
  levelId: string;
  initialValues?: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number | null;
    orderIndex: number;
  };
};

export function SessionDialog({
  trigger,
  mode,
  sequenceId,
  unitId,
  levelId,
  initialValues,
}: SessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateSession(
            initialValues.id,
            sequenceId,
            unitId,
            levelId,
            undefined,
            formData
          )
        : await createSession(sequenceId, unitId, levelId, undefined, formData);

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
          <DialogTitle>{mode === "create" ? "Nouvelle séance" : "Modifier la séance"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="ex. PAN et LAN"
              defaultValue={initialValues?.title}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={initialValues?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Durée (minutes, optionnel)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              defaultValue={initialValues?.durationMinutes ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderIndex">Ordre d&apos;affichage</Label>
            <Input
              id="orderIndex"
              name="orderIndex"
              type="number"
              defaultValue={initialValues?.orderIndex ?? 0}
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
