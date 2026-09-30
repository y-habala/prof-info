"use client";

import { useState } from "react";
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
import { createMatchingSet } from "@/actions/exam-questions";

type PairDraft = { prompt: string; correctPoolIndex: number };

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MatchingSetDialog({
  trigger,
  examId,
  nextOrderIndex,
  sectionId,
}: {
  trigger: React.ReactNode;
  examId: string;
  nextOrderIndex: number;
  sectionId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pool, setPool] = useState<string[]>(["", ""]);
  const [pairs, setPairs] = useState<PairDraft[]>([{ prompt: "", correctPoolIndex: 0 }]);
  const [points, setPoints] = useState(0.5);

  function reset() {
    setPool(["", ""]);
    setPairs([{ prompt: "", correctPoolIndex: 0 }]);
    setPoints(0.5);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    setIsPending(true);
    const result = await createMatchingSet(examId, nextOrderIndex, { pool, pairs, points }, sectionId);
    setIsPending(false);
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
        if (next) reset();
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un ensemble d&apos;appariement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le pool de termes ci-dessous est proposé, identique, dans chaque menu déroulant —
            saisissez-le une seule fois pour tout l&apos;ensemble.
          </p>

          <div className="space-y-2">
            <Label>Termes possibles (pool partagé)</Label>
            {pool.map((text, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={text}
                  onChange={(e) =>
                    setPool((prev) => prev.map((t, i) => (i === index ? e.target.value : t)))
                  }
                  placeholder={`Terme ${index + 1}`}
                  required
                />
                {pool.length > 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPool((prev) => prev.filter((_, i) => i !== index));
                      setPairs((prev) =>
                        prev.map((p) => ({
                          ...p,
                          correctPoolIndex:
                            p.correctPoolIndex > index ? p.correctPoolIndex - 1 : p.correctPoolIndex,
                        }))
                      );
                    }}
                  >
                    ✕
                  </Button>
                ) : null}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setPool((prev) => [...prev, ""])}>
              + Ajouter un terme
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Paires</Label>
            {pairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={pair.prompt}
                  onChange={(e) =>
                    setPairs((prev) =>
                      prev.map((p, i) => (i === index ? { ...p, prompt: e.target.value } : p))
                    )
                  }
                  placeholder={`Élément ${index + 1} (ex. Ctrl + Z)`}
                  required
                />
                <select
                  value={pair.correctPoolIndex}
                  onChange={(e) =>
                    setPairs((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, correctPoolIndex: Number(e.target.value) } : p
                      )
                    )
                  }
                  className={selectClass}
                >
                  {pool.map((text, poolIndex) => (
                    <option key={poolIndex} value={poolIndex}>
                      {text || `Terme ${poolIndex + 1}`}
                    </option>
                  ))}
                </select>
                {pairs.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPairs((prev) => prev.filter((_, i) => i !== index))}
                  >
                    ✕
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPairs((prev) => [...prev, { prompt: "", correctPoolIndex: 0 }])}
            >
              + Ajouter une paire
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="matching-points">Points par paire</Label>
            <Input
              id="matching-points"
              type="number"
              min="0"
              step="0.25"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Enregistrement..." : "Ajouter l'ensemble"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
