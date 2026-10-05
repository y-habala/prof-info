"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExamModel, updateExamModel } from "@/actions/exams";

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  examId: string;
  mode: "create" | "edit";
  initialValues?: { id: string; label: string; secretCode: string };
};

export function ExamModelDialog({ trigger, examId, mode, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateExamModel(initialValues.id, examId, undefined, formData)
        : await createExamModel(examId, undefined, formData);
    setIsPending(false);
    if (result?.error) setError(result.error);
    else setOpen(false);
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
      <DialogTrigger render={trigger}>{trigger.props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouveau modèle" : "Modifier le modèle"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="label">Libellé</Label>
              <Input
                id="label"
                name="label"
                maxLength={3}
                placeholder="A"
                defaultValue={initialValues?.label ?? ""}
                required
                className="font-mono text-lg font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretCode">Code (4 chiffres)</Label>
              <Input
                id="secretCode"
                name="secretCode"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                placeholder="ex. 2001"
                defaultValue={initialValues?.secretCode ?? ""}
                required
                className="font-mono tracking-[0.3em]"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Le libellé distingue visuellement les modèles. Le code secret est ce que l&apos;élève tape
            pour accéder précisément à ce modèle.
          </p>
          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="w-full gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
