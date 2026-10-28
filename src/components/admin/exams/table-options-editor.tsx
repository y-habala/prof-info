"use client";
import { useState, useTransition } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { replaceExamOptions } from "@/actions/exams";
import { COL_SEP, COLS_MARK, PAIR_SEP, parseTable } from "@/lib/exam-interactive";
import { cn } from "@/lib/utils";

type Row = { text: string; ticked: number[] };

// Grid editor for "Tableau": columns across, rows down, tick the right box(es).
export function TableOptionsEditor({
  questionId,
  modelId,
  examId,
  initial,
}: {
  questionId: string;
  modelId: string;
  examId: string;
  initial: string[];
}) {
  const parsed = parseTable(initial.map((text, i) => ({ id: String(i), text, orderIndex: i })));
  const startCols = parsed.columns.length >= 2 ? parsed.columns : ["Colonne 1", "Colonne 2"];
  const [columns, setColumns] = useState<string[]>(startCols);
  const [rows, setRows] = useState<Row[]>(() => {
    const r = parsed.rows
      .filter((row) => row.text)
      .map((row) => ({ text: row.text, ticked: row.correct.map((c) => startCols.indexOf(c)).filter((i) => i >= 0) }));
    return r.length > 0 ? r : [{ text: "", ticked: [] }, { text: "", ticked: [] }];
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const touch = () => setSaved(false);

  function toggle(r: number, c: number) {
    setRows((prev) =>
      prev.map((row, i) =>
        i !== r ? row : { ...row, ticked: row.ticked.includes(c) ? row.ticked.filter((x) => x !== c) : [...row.ticked, c] }
      )
    );
    touch();
  }
  function removeColumn(c: number) {
    setColumns((prev) => prev.filter((_, i) => i !== c));
    setRows((prev) => prev.map((row) => ({ ...row, ticked: row.ticked.filter((x) => x !== c).map((x) => (x > c ? x - 1 : x)) })));
    touch();
  }

  function save() {
    const cols = columns.map((c) => c.trim());
    if (cols.some((c) => !c) || new Set(cols).size !== cols.length) {
      setError("Chaque colonne doit avoir un titre, et deux colonnes ne peuvent pas avoir le même titre.");
      return;
    }
    const complete = rows.filter((r) => r.text.trim());
    if (complete.length < 1) {
      setError("Ajoute au moins une ligne.");
      return;
    }
    const missing = complete.find((r) => r.ticked.length === 0);
    if (missing) {
      setError(`Coche au moins une bonne case pour « ${missing.text.trim()} ».`);
      return;
    }
    if ([...cols, ...complete.map((r) => r.text)].some((t) => t.includes(PAIR_SEP) || t.includes(COL_SEP))) {
      setError(`Le texte ne peut pas contenir « ${PAIR_SEP} » ni « ${COL_SEP} ».`);
      return;
    }
    setError(null);
    startTransition(async () => {
      await replaceExamOptions(questionId, modelId, examId, [
        { text: `${COLS_MARK}${PAIR_SEP}${cols.join(COL_SEP)}`, isCorrect: false },
        ...complete.map((r) => ({
          text: `${r.text.trim()}${PAIR_SEP}${[...r.ticked].sort((a, b) => a - b).map((i) => cols[i]).join(COL_SEP)}`,
          isCorrect: true,
        })),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tableau à cocher</p>
        <p className="text-xs text-muted-foreground">
          Écris les titres des colonnes et des lignes, puis coche la ou les bonnes cases de chaque ligne.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-48 p-1" />
              {columns.map((c, ci) => (
                <th key={ci} className="min-w-36 p-1 align-bottom">
                  <div className="flex items-center gap-1">
                    <Input
                      value={c}
                      onChange={(e) => {
                        setColumns((prev) => prev.map((x, i) => (i === ci ? e.target.value : x)));
                        touch();
                      }}
                      placeholder={`Colonne ${ci + 1}`}
                      className="h-8 text-center font-semibold"
                    />
                    {columns.length > 2 ? (
                      <button
                        type="button"
                        onClick={() => removeColumn(ci)}
                        aria-label="Supprimer la colonne"
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
              <th className="w-10 p-1">
                <Button
                  size="sm"
                  variant="outline"
                  title="Ajouter une colonne"
                  onClick={() => {
                    setColumns((prev) => [...prev, ""]);
                    touch();
                  }}
                >
                  <Plus className="size-3.5" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-border">
                <td className="p-1">
                  <Input
                    value={r.text}
                    onChange={(e) => {
                      setRows((prev) => prev.map((x, i) => (i === ri ? { ...x, text: e.target.value } : x)));
                      touch();
                    }}
                    placeholder={`Ligne ${ri + 1}`}
                    className="h-8 font-semibold"
                  />
                </td>
                {columns.map((_, ci) => {
                  const on = r.ticked.includes(ci);
                  return (
                    <td key={ci} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(ri, ci)}
                        aria-pressed={on}
                        aria-label={`Ligne ${ri + 1}, colonne ${ci + 1}`}
                        className={cn(
                          "mx-auto flex size-8 items-center justify-center rounded-md border-2 transition-colors",
                          on ? "border-success bg-success text-success-foreground" : "border-input bg-background hover:border-foreground/40"
                        )}
                      >
                        {on ? <Check className="size-4" strokeWidth={3} /> : null}
                      </button>
                    </td>
                  );
                })}
                <td className="p-1">
                  {rows.length > 1 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      title="Supprimer la ligne"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setRows((prev) => prev.filter((_, i) => i !== ri));
                        touch();
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            setRows((prev) => [...prev, { text: "", ticked: [] }]);
            touch();
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
