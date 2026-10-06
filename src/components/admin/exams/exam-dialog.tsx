"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { upsertExam } from "@/actions/exams";

type Level = { id: string; name: string };

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  mode: "create" | "edit";
  levels: Level[];
  initialValues?: {
    id: string;
    title: string;
    levelId: string | null;
    durationMinutes: number;
    startAt: string | null;
    endAt: string | null;
    maxAttempts: number;
  };
};

function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExamDialog({ trigger, mode, levels, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await upsertExam(initialValues?.id ?? null, undefined, formData);
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvel examen" : "Modifier l'examen"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" placeholder="ex. Contrôle N°2 — Algorithmique" defaultValue={initialValues?.title} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="levelId">Niveau</Label>
              <Select id="levelId" name="levelId" defaultValue={initialValues?.levelId ?? ""}>
                <option value="">—</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Durée (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                defaultValue={initialValues?.durationMinutes ?? 60}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startAt">Début (optionnel)</Label>
              <Input id="startAt" name="startAt" type="datetime-local" defaultValue={toDateTimeLocal(initialValues?.startAt ?? null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">Fin (optionnel)</Label>
              <Input id="endAt" name="endAt" type="datetime-local" defaultValue={toDateTimeLocal(initialValues?.endAt ?? null)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAttempts">Tentatives maximum par élève</Label>
            <Input id="maxAttempts" name="maxAttempts" type="number" min="1" defaultValue={initialValues?.maxAttempts ?? 1} />
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
