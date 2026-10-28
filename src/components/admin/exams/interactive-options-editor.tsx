"use client";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { replaceExamOptions } from "@/actions/exams";
import { PAIR_SEP, splitPair, type InteractiveType } from "@/lib/exam-interactive";

type Row = { left: string; right: string };

const COPY: Record<InteractiveType, { title: string; left: string; right?: string; help: string }> = {
  association: {
    title: "Paires à relier",
    left: "Élément (colonne de gauche)",
    right: "Correspondance (colonne de droite)",
    help: "L'élève verra les deux colonnes mélangées et devra relier chaque élément à sa correspondance.",
  },
  ordering: {
    title: "Éléments dans le bon ordre",
    left: "Élément",
    help: "Saisis les éléments dans l'ordre correct : l'élève les recevra mélangés et devra les remettre dans cet ordre.",
  },
  categorize: {
    title: "Éléments et leur catégorie",
    left: "Élément",
    right: "Catégorie",
    help: "Écris la catégorie de chaque élément (même orthographe pour une même catégorie). L'élève classera les éléments dans ces catégories.",
  },
};

export function InteractiveOptionsEditor({
  type,
  questionId,
  modelId,
  examId,
  initial,
}: {
  type: InteractiveType;
  questionId: string;
  modelId: string;
  examId: string;
  initial: string[];
}) {
  const twoCols = type !== "ordering";
  const [rows, setRows] = useState<Row[]>(() => {
    const parsed = initial.map((t) => (twoCols ? splitPair(t) : [t.trim(), ""])).map(([left, right]) => ({ left, right }));
    const filled = parsed.filter((r) => r.left || r.right);
    return filled.length > 0 ? filled : [{ left: "", right: "" }, { left: "", right: "" }];
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[type];

  const categories = twoCols && type === "categorize" ? [...new Set(rows.map((r) => r.right.trim()).filter(Boolean))] : [];

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setSaved(false);
  }
  function move(i: number, dir: -1 | 1) {
    setRows((prev) => {
      const next = prev.slice();
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
    setSaved(false);
  }

  function save() {
    const complete = rows.filter((r) => r.left.trim() && (!twoCols || r.right.trim()));
    if (complete.length < 2) {
      setError(twoCols ? "Il faut au moins 2 lignes complètes (les deux colonnes remplies)." : "Il faut au moins 2 éléments.");
      return;
    }
    if (type === "categorize" && new Set(complete.map((r) => r.right.trim())).size < 2) {
      setError("Il faut au moins 2 catégories différentes.");
      return;
    }
    if ([...rows.map((r) => r.left), ...rows.map((r) => r.right)].some((t) => t.includes(PAIR_SEP))) {
      setError(`Le texte ne peut pas contenir « ${PAIR_SEP} ».`);
      return;
    }
    setError(null);
    startTransition(async () => {
      await replaceExamOptions(
        questionId,
        modelId,
        examId,
        complete.map((r) => ({
          text: twoCols ? `${r.left.trim()}${PAIR_SEP}${r.right.trim()}` : r.left.trim(),
          isCorrect: true,
        }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.title}</p>
      <p className="text-xs text-muted-foreground">{copy.help}</p>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
            <Input
              value={r.left}
              onChange={(e) => update(i, { left: e.target.value })}
              placeholder={copy.left}
              className="h-8"
            />
            {twoCols ? (
              <>
                <span className="shrink-0 text-muted-foreground">→</span>
                <Input
                  value={r.right}
                  onChange={(e) => update(i, { right: e.target.value })}
                  placeholder={copy.right}
                  list={type === "categorize" ? `cats-${questionId}` : undefined}
                  className="h-8"
                />
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" disabled={i === 0} onClick={() => move(i, -1)} title="Monter">
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={i === rows.length - 1} onClick={() => move(i, 1)} title="Descendre">
                  <ArrowDown className="size-3.5" />
                </Button>
              </>
            )}
            {rows.length > 2 ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setRows((prev) => prev.filter((_, j) => j !== i));
                  setSaved(false);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {type === "categorize" ? (
        <datalist id={`cats-${questionId}`}>
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            setRows((prev) => [...prev, { left: "", right: "" }]);
            setSaved(false);
          }}
        >
          <Plus className="size-3.5" />
          Ajouter une ligne
        </Button>
        <div className="flex items-center gap-2">
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <Check className="size-3.5" />
              Enregistré
            </span>
          ) : null}
          <Button size="sm" disabled={isPending} onClick={save}>
            Enregistrer les réponses
          </Button>
        </div>
      </div>
    </div>
  );
}
