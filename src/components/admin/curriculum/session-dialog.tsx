"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertSession } from "@/actions/curriculum";

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  mode: "create" | "edit";
  sequenceId: string;
  levelId: string;
  initialValues?: {
    id: string;
    title: string;
    durationMinutes: number | null;
    orderIndex: number;
  };
};

export function SessionDialog({ trigger, mode, sequenceId, levelId, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    // contentMarkdown is deprecated — content is now in lesson_blocks. Pass
    // empty string so the schema accepts it and the DB column stays empty.
    formData.set("contentMarkdown", "");
    const result = await upsertSession(initialValues?.id ?? null, sequenceId, levelId, undefined, formData);
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
          <DialogTitle>{mode === "create" ? "Nouvelle séance" : "Modifier la séance"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={initialValues?.title} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Durée (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                defaultValue={initialValues?.durationMinutes ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Ordre</Label>
              <Input id="orderIndex" name="orderIndex" type="number" min="0" defaultValue={initialValues?.orderIndex ?? 0} />
            </div>
          </div>
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Le contenu de la séance (textes, images, vidéos, exercices, activités) se gère via le bouton <strong>Contenu</strong> à côté de la séance.
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
