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
import { AVAILABLE_BLOCK_TYPES, BLOCK_TYPE_LABELS, type BlockType } from "@/schemas/lesson-contents";
import { createLessonContent, updateLessonContent } from "@/actions/lesson-contents";
import { BlockFormFields, type BlockContentValues } from "./block-form-fields";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type BlockDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  sessionId: string;
  nextOrderIndex?: number;
  exercises?: { id: string; title: string }[];
  initialValues?: {
    id: string;
    type: BlockType;
    title: string | null;
    content: BlockContentValues;
  };
};

export function BlockDialog({
  trigger,
  mode,
  sessionId,
  nextOrderIndex,
  exercises,
  initialValues,
}: BlockDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<BlockType | null>(
    mode === "edit" ? initialValues?.type ?? null : null
  );

  async function handleAction(formData: FormData) {
    if (!selectedType) return;
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateLessonContent(initialValues.id, sessionId, selectedType, undefined, formData)
        : await createLessonContent(
            sessionId,
            selectedType,
            nextOrderIndex ?? 0,
            undefined,
            formData
          );

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
          if (mode === "create") setSelectedType(null);
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter un bloc" : "Modifier le bloc"}</DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AVAILABLE_BLOCK_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                onClick={() => setSelectedType(type)}
              >
                {BLOCK_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        ) : (
          <form action={handleAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du bloc (optionnel)</Label>
              <Input id="title" name="title" defaultValue={initialValues?.title ?? ""} />
            </div>
            <BlockFormFields
              type={selectedType}
              initialValues={initialValues?.content}
              exercises={exercises}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              {mode === "create" ? (
                <Button type="button" variant="ghost" onClick={() => setSelectedType(null)}>
                  ← Changer de type
                </Button>
              ) : null}
              <SubmitButton label={mode === "create" ? "Ajouter" : "Enregistrer"} />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
