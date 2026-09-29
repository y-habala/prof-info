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
import { createUnit, updateUnit } from "@/actions/units";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type UnitDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  levelId: string;
  initialValues?: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    orderIndex: number;
  };
};

export function UnitDialog({ trigger, mode, levelId, initialValues }: UnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateUnit(initialValues.id, levelId, undefined, formData)
        : await createUnit(levelId, undefined, formData);

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
          <DialogTitle>{mode === "create" ? "Nouvelle unité" : "Modifier l'unité"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="ex. Réseaux informatiques"
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
            <Label htmlFor="imageUrl">Image (URL, optionnel)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              placeholder="https://..."
              defaultValue={initialValues?.imageUrl ?? ""}
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
