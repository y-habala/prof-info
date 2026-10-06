"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { upsertExercise } from "@/actions/exercises";

type Level = { id: string; name: string };

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  mode: "create" | "edit";
  levels: Level[];
  initialValues?: { id: string; title: string; levelId: string | null; orderIndex: number };
};

export function ExerciseDialog({ trigger, mode, levels, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await upsertExercise(initialValues?.id ?? null, undefined, formData);
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
          <DialogTitle>{mode === "create" ? "Nouvel exercice" : "Modifier l'exercice"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={initialValues?.title} required />
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-2">
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
              <Label htmlFor="orderIndex">Ordre</Label>
              <Input id="orderIndex" name="orderIndex" type="number" min="0" defaultValue={initialValues?.orderIndex ?? 0} />
            </div>
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
