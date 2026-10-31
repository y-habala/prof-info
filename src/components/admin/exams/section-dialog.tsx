"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertExamSection } from "@/actions/exams";

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  mode: "create" | "edit";
  modelId: string;
  examId: string;
  initialValues?: { id: string; title: string; description: string | null; imageUrl: string | null };
};

export function SectionDialog({ trigger, mode, modelId, examId, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await upsertExamSection(initialValues?.id ?? null, modelId, examId, undefined, formData);
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
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle section" : "Modifier la section"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" placeholder="ex. Exercice 1 — Vrai / Faux" defaultValue={initialValues?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Consigne de l&apos;exercice (optionnel)</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={2000}
              placeholder="ex. Relie chaque raccourci à sa fonction."
              defaultValue={initialValues?.description ?? ""}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image (URL, optionnel)</Label>
            <Input id="imageUrl" name="imageUrl" placeholder="https://…" defaultValue={initialValues?.imageUrl ?? ""} />
          </div>
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
