"use client";
import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkInlineExerciseAnswers } from "@/actions/exercises";
import { cn } from "@/lib/utils";

export type ExerciseQuestion = {
  id: string;
  text: string;
  type: string;
  points: number;
  options: { id: string; text: string }[];
};

type Result = {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  correctOptionIds: string[];
};

type CheckResult = { results: Result[]; score: number; maxScore: number };

export function InlineExerciseRunner({
  exerciseId,
  exerciseTitle,
  questions,
}: {
  exerciseId: string;
  exerciseTitle: string;
  questions: ExerciseQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, { optionIds?: string[]; text?: string }>>({});
  const [checked, setChecked] = useState<CheckResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleOption(qId: string, oId: string, multi: boolean) {
    setAnswers((prev) => {
      const cur = prev[qId]?.optionIds ?? [];
      const next = multi
        ? cur.includes(oId) ? cur.filter((x) => x !== oId) : [...cur, oId]
        : [oId];
      return { ...prev, [qId]: { optionIds: next } };
    });
    setChecked(null);
  }

  function setText(qId: string, val: string) {
    setAnswers((prev) => ({ ...prev, [qId]: { text: val } }));
    setChecked(null);
  }

  function reset() {
    setAnswers({});
    setChecked(null);
  }

  function submit() {
    const payload = questions.map((q) => ({
      questionId: q.id,
      optionIds: answers[q.id]?.optionIds,
      text: answers[q.id]?.text,
    }));
    startTransition(async () => {
      const res = await checkInlineExerciseAnswers(exerciseId, payload);
      setChecked(res);
    });
  }

  const allAnswered = questions.every((q) => {
    const a = answers[q.id];
    if (q.type === "fill_blank") return (a?.text ?? "").trim().length > 0;
    return (a?.optionIds ?? []).length > 0;
  });

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {exerciseTitle} — aucune question configurée.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">{exerciseTitle}</h3>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const result = checked?.results.find((r) => r.questionId === q.id);
          const answer = answers[q.id];
          const isMulti = q.type === "qcm_multiple";
          const isFill = q.type === "fill_blank";

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                result
                  ? result.isCorrect
                    ? "border-success/40 bg-success/5"
                    : "border-destructive/40 bg-destructive/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  Q{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{q.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {q.points} pt{q.points > 1 ? "s" : ""}
                  </p>
                </div>
                {result ? (
                  result.isCorrect ? (
                    <CheckCircle className="size-5 shrink-0 text-success" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-destructive" />
                  )
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {isFill ? (
                  <input
                    type="text"
                    disabled={!!checked}
                    value={answer?.text ?? ""}
                    onChange={(e) => setText(q.id, e.target.value)}
                    placeholder="Votre réponse…"
                    className={cn(
                      "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60",
                      result && !result.isCorrect && "border-destructive/50"
                    )}
                  />
                ) : (
                  q.options.map((o) => {
                    const selected = (answer?.optionIds ?? []).includes(o.id);
                    const isCorrectOpt = !!result?.correctOptionIds.includes(o.id);
                    const isWrongSelected = !!checked && selected && !isCorrectOpt;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        disabled={!!checked}
                        onClick={() => toggleOption(q.id, o.id, isMulti)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                          !checked && selected
                            ? "border-primary/60 bg-primary/10 font-medium"
                            : "border-input bg-background",
                          checked && isCorrectOpt
                            ? "border-success/60 bg-success/10 font-medium"
                            : "",
                          checked && isWrongSelected
                            ? "border-destructive/40 bg-destructive/5 opacity-70 line-through"
                            : ""
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                            isMulti ? "rounded-sm" : "rounded-full",
                            !checked && selected ? "border-primary bg-primary text-white" : "border-input",
                            checked && isCorrectOpt ? "border-success bg-success text-white" : "",
                            checked && isWrongSelected ? "border-destructive bg-destructive/20 text-destructive" : ""
                          )}
                        >
                          {(selected || (checked && isCorrectOpt)) ? "✓" : ""}
                        </span>
                        {o.text}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!checked ? (
        <Button
          onClick={submit}
          disabled={!allAnswered || isPending}
          className="gap-2"
        >
          {isPending ? "Vérification…" : "Vérifier mes réponses"}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
          <Trophy
            className={cn(
              "size-6 shrink-0",
              checked.maxScore > 0 && checked.score / checked.maxScore >= 0.5
                ? "text-[var(--gold)]"
                : "text-muted-foreground"
            )}
          />
          <div className="flex-1">
            <p className="font-semibold">
              Score : {checked.score} / {checked.maxScore} pt
              {checked.maxScore !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {checked.maxScore > 0
                ? `${Math.round((checked.score / checked.maxScore) * 100)} %`
                : "—"}
            </p>
          </div>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="size-3.5" />
            Recommencer
          </Button>
        </div>
      )}
    </div>
  );
}
