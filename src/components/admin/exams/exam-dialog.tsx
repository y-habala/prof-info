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
import { createExam, updateExam } from "@/actions/exams";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

type Level = { id: string; name: string };

type ExamDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  levels: Level[];
  initialValues?: {
    id: string;
    title: string;
    description: string | null;
    levelId: string | null;
    durationMinutes: number;
    secretCode: string;
    startAt: string | null;
    endAt: string | null;
    maxAttempts: number;
  };
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's own local
// time — the stored value is a UTC ISO string, so this must go through
// Date's local getters rather than slicing the UTC string directly
// (mirrors, in reverse, the local-to-UTC conversion done on submit below).
function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExamDialog({ trigger, mode, levels, initialValues }: ExamDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setError(null);

    // datetime-local gives a bare "YYYY-MM-DDTHH:mm" with no timezone info,
    // which Postgres would otherwise parse as UTC — converting through
    // `Date` here first reads it as the browser's own local time (the
    // admin's intent) before it becomes a real UTC instant.
    for (const field of ["startAt", "endAt"] as const) {
      const raw = formData.get(field);
      if (typeof raw === "string" && raw) {
        formData.set(field, new Date(raw).toISOString());
      }
    }

    const result =
      mode === "edit" && initialValues
        ? await updateExam(initialValues.id, undefined, formData)
        : await createExam(undefined, formData);

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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvel examen" : "Modifier l'examen"}</DialogTitle>
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
          <div className="space-y-2">
            <Label htmlFor="levelId">Niveau</Label>
            <select id="levelId" name="levelId" className={selectClass} defaultValue={initialValues?.levelId ?? ""}>
              <option value="">—</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Durée (minutes)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                defaultValue={initialValues?.durationMinutes ?? 60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretCode">Code secret (4 chiffres)</Label>
              <Input
                id="secretCode"
                name="secretCode"
                inputMode="numeric"
                maxLength={4}
                defaultValue={initialValues?.secretCode}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startAt">Début (optionnel)</Label>
              <Input
                id="startAt"
                name="startAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(initialValues?.startAt ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">Fin (optionnel)</Label>
              <Input
                id="endAt"
                name="endAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(initialValues?.endAt ?? null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAttempts">Tentatives maximum par élève</Label>
            <Input
              id="maxAttempts"
              name="maxAttempts"
              type="number"
              min="1"
              defaultValue={initialValues?.maxAttempts ?? 1}
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
