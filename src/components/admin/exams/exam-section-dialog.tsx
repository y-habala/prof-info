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
import { FileUploadField } from "@/components/admin/files/file-upload-field";
import { createExamSection, updateExamSection } from "@/actions/exam-sections";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type ExamSectionDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  examId: string;
  nextOrderIndex?: number;
  initialValues?: { id: string; title: string; imageUrl: string | null };
};

export function ExamSectionDialog({
  trigger,
  mode,
  examId,
  nextOrderIndex,
  initialValues,
}: ExamSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");

  async function handleAction(formData: FormData) {
    setError(null);
    formData.set("imageUrl", imageUrl);
    const result =
      mode === "edit" && initialValues
        ? await updateExamSection(initialValues.id, examId, undefined, formData)
        : await createExamSection(examId, nextOrderIndex ?? 0, undefined, formData);

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
          setImageUrl(initialValues?.imageUrl ?? "");
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle section" : "Modifier la section"}</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="ex. Exercice 1"
              defaultValue={initialValues?.title}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Image (optionnel — partagée par toutes les questions de la section)</Label>
            {imageUrl ? (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-provided upload preview */}
                <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                  Retirer
                </Button>
              </div>
            ) : (
              <FileUploadField bucket="lesson-images" accept="image/*" onUploaded={(url) => setImageUrl(url)} />
            )}
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
