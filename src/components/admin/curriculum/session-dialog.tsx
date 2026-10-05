"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    contentMarkdown: string;
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle séance" : "Modifier la séance"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px_100px]">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" defaultValue={initialValues?.title} required />
            </div>
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
          <div className="space-y-2">
            <Label htmlFor="contentMarkdown">Contenu (markdown)</Label>
            <Textarea
              id="contentMarkdown"
              name="contentMarkdown"
              rows={14}
              placeholder="# Titre&#10;&#10;Un paragraphe explicatif.&#10;&#10;- Point 1&#10;- Point 2&#10;&#10;**Important** : …"
              defaultValue={initialValues?.contentMarkdown ?? ""}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Markdown : <code>#</code> titre, <code>**gras**</code>, <code>*italique*</code>, <code>-</code> liste, <code>[texte](lien)</code>, <code>![alt](image)</code>.
            </p>
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
