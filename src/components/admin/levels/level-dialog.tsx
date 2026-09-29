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
import { createLevel, updateLevel } from "@/actions/levels";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type LevelDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  initialValues?: {
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
  };
};

export function LevelDialog({ trigger, mode, initialValues }: LevelDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateLevel(initialValues.id, undefined, formData)
        : await createLevel(undefined, formData);

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
          <DialogTitle>{mode === "create" ? "Nouveau niveau" : "Modifier le niveau"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              name="name"
              placeholder="ex. 3APIC"
              defaultValue={initialValues?.name}
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
