"use client";
import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExerciseQuestionDialog } from "./exercise-question-dialog";
import { deleteExerciseQuestion, replaceExerciseOptions } from "@/actions/exercises";
import { EXERCISE_QUESTION_TYPE_LABELS, type ExerciseQuestionType } from "@/schemas/exercises";
import { cn } from "@/lib/utils";

export type OptionData = { id: string; text: string; isCorrect: boolean };
export type QuestionData = {
  id: string;
  text: string;
  type: ExerciseQuestionType;
  points: number;
  options: OptionData[];
};

export function ExerciseQuestionsList({
  exerciseId,
  questions,
}: {
  exerciseId: string;
  questions: QuestionData[];
}) {
  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
        Aucune question. Clique sur <strong>+ Nouvelle question</strong>.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <QuestionItem key={q.id} question={q} index={i + 1} exerciseId={exerciseId} />
      ))}
    </div>
  );
}

function QuestionItem({ question, index, exerciseId }: { question: QuestionData; index: number; exerciseId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Q{index}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{question.text}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{EXERCISE_QUESTION_TYPE_LABELS[question.type]}</Badge>
              <Badge variant="outline">{question.points} pt{question.points > 1 ? "s" : ""}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExerciseQuestionDialog
            mode="edit"
            exerciseId={exerciseId}
            initialValues={{ id: question.id, text: question.text, type: question.type, points: question.points }}
            trigger={<Button size="sm" variant="outline" className="gap-1.5"><Pencil className="size-3.5" /></Button>}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm("Supprimer cette question ?")) {
                startTransition(() => deleteExerciseQuestion(question.id, exerciseId));
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <OptionsEditor question={question} exerciseId={exerciseId} />
    </Card>
  );
}

function OptionsEditor({ question, exerciseId }: { question: QuestionData; exerciseId: string }) {
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    question.options.length > 0
      ? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : question.type === "true_false"
        ? [{ text: "Vrai", isCorrect: false }, { text: "Faux", isCorrect: false }]
        : question.type === "fill_blank"
          ? [{ text: "", isCorrect: true }]
          : [{ text: "", isCorrect: false }, { text: "", isCorrect: false }]
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isSingle = question.type === "qcm_single" || question.type === "true_false" || question.type === "matching";
  const isFill = question.type === "fill_blank";

  function updateText(i: number, text: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text } : o)));
    setSaved(false);
  }
  function toggleCorrect(i: number) {
    setOptions((prev) =>
      prev.map((o, idx) =>
        isSingle ? { ...o, isCorrect: idx === i } : idx === i ? { ...o, isCorrect: !o.isCorrect } : o
      )
    );
    setSaved(false);
  }
  function addOption() { setOptions((prev) => [...prev, { text: "", isCorrect: false }]); setSaved(false); }
  function removeOption(i: number) { setOptions((prev) => prev.filter((_, idx) => idx !== i)); setSaved(false); }
  function save() {
    startTransition(async () => {
      await replaceExerciseOptions(question.id, exerciseId, options);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isFill ? "Réponse(s) correcte(s)" : isSingle ? "Choix (une seule bonne réponse)" : "Choix (plusieurs bonnes réponses)"}
      </p>
      <div className="space-y-1.5">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCorrect(i)}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                isSingle ? "rounded-full" : "",
                o.isCorrect
                  ? "border-success bg-success text-success-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-foreground/40"
              )}
            >
              {o.isCorrect ? <Check className="size-4" strokeWidth={3} /> : null}
            </button>
            <Input value={o.text} onChange={(e) => updateText(i, e.target.value)} placeholder={isFill ? "Réponse acceptée" : `Option ${String.fromCharCode(97 + i)}`} className="h-8" />
            {!isFill && options.length > 2 ? (
              <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeOption(i)}>
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={addOption} className="gap-1.5">
          <Plus className="size-3.5" />
          {isFill ? "Ajouter une variante" : "Ajouter"}
        </Button>
        <div className="flex items-center gap-2">
          {saved ? <span className="inline-flex items-center gap-1 text-xs text-success"><Check className="size-3.5" />Enregistré</span> : null}
          <Button size="sm" disabled={isPending} onClick={save}>Enregistrer les réponses</Button>
        </div>
      </div>
    </div>
  );
}
