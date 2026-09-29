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
import { createExercise, updateExercise } from "@/actions/exercises";
import { CurriculumSelector, type CurriculumTree } from "./curriculum-selector";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type ExerciseDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  tree: CurriculumTree;
  initialValues?: {
    id: string;
    title: string;
    description: string | null;
    levelId: string | null;
    unitId: string | null;
    sequenceId: string | null;
    sessionId: string | null;
    durationMinutes: number | null;
  };
};

export function ExerciseDialog({ trigger, mode, tree, initialValues }: ExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Forces the form (and CurriculumSelector's internal state, which lives
  // outside the Dialog's own remount boundary) to start fresh every time
  // this reopens — otherwise a 2nd "create" in the same page visit starts
  // from whatever level/unit/sequence/session was left selected last time.
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateExercise(initialValues.id, undefined, formData)
        : await createExercise(undefined, formData);

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
        if (next) {
          setError(null);
          setFormKey((k) => k + 1);
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvel exercice" : "Modifier l'exercice"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={initialValues?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={initialValues?.description ?? ""} />
          </div>
          <CurriculumSelector
            tree={tree}
            initialValues={{
              levelId: initialValues?.levelId ?? "",
              unitId: initialValues?.unitId ?? "",
              sequenceId: initialValues?.sequenceId ?? "",
              sessionId: initialValues?.sessionId ?? "",
            }}
          />
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Durée (minutes, optionnel)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              defaultValue={initialValues?.durationMinutes ?? ""}
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
