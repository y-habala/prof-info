"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { duplicateExamModel } from "@/actions/exams";

// First letter after the ones already used (A, B → C).
function nextLabel(used: string[]): string {
  const taken = new Set(used.map((l) => l.trim().toUpperCase()));
  for (let c = 65; c <= 90; c++) {
    const l = String.fromCharCode(c);
    if (!taken.has(l)) return l;
  }
  return "";
}

const randomCode = () => String(Math.floor(Math.random() * 10000)).padStart(4, "0");

// Copies a model (sections, questions, answers) under a new letter and code,
// then opens the copy so it can be edited into the next variant.
export function DuplicateModelDialog({
  trigger,
  examId,
  modelId,
  modelLabel,
  existingLabels,
}: {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  examId: string;
  modelId: string;
  modelLabel: string;
  existingLabels: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const l = label.trim().toUpperCase();
    if (!l) return setError("Le libellé est requis.");
    if (!/^\d{4}$/.test(code)) return setError("Le code doit contenir 4 chiffres.");
    setIsPending(true);
    setError(null);
    const result = await duplicateExamModel(modelId, examId, l, code);
    setIsPending(false);
    if (result && "error" in result && result.error) return setError(result.error);
    if (result && "newModelId" in result) {
      setOpen(false);
      router.push(`/admin/exams/${examId}/models/${result.newModelId}`);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLabel(nextLabel(existingLabels));
          setCode(randomCode());
          setError(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dupliquer le modèle {modelLabel.toUpperCase()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Toutes les sections, questions et réponses du modèle {modelLabel.toUpperCase()} sont copiées dans un
            nouveau modèle, que tu pourras ensuite modifier.
          </p>
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="dup-label">Libellé</Label>
              <Input
                id="dup-label"
                value={label}
                maxLength={3}
                onChange={(e) => setLabel(e.target.value)}
                className="text-center font-mono text-lg font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dup-code">Code secret (4 chiffres)</Label>
              <div className="flex gap-2">
                <Input
                  id="dup-code"
                  value={code}
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="font-mono text-lg font-bold tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCode(randomCode())}
                  title="Générer un autre code"
                  aria-label="Générer un autre code"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="w-full gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Dupliquer et modifier
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
