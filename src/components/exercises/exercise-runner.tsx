"use client";
import { useState } from "react";
import { Check, X, Send, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeAnswerText } from "@/lib/normalize-text";
import { scoreOutOf20, getAppreciation } from "@/lib/grading";
import type { ExerciseQuestionType } from "@/schemas/exercises";

export type RunnerOption = { id: string; text: string; isCorrect: boolean };
export type RunnerQuestion = {
  id: string;
  text: string;
  type: ExerciseQuestionType;
  points: number;
  options: RunnerOption[];
};

const LETTERS = "abcdefghij";

type Answer = string[] | string | undefined;

function isAnswered(q: RunnerQuestion, a: Answer): boolean {
  if (q.type === "fill_blank") return typeof a === "string" && a.trim().length > 0;
  return Array.isArray(a) && a.length > 0;
}

// Grade a single question client-side. For exercises, we trust the client
// completely — the "right" answer is already in the DOM for the student
// to see once they submit anyway (that's the whole point of self-check).
function gradeQuestion(q: RunnerQuestion, answer: Answer): boolean {
  const correctIds = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
  if (q.type === "qcm_single" || q.type === "true_false" || q.type === "matching") {
    if (!Array.isArray(answer) || answer.length === 0) return false;
    return correctIds.has(answer[0]);
  }
  if (q.type === "qcm_multiple") {
    if (!Array.isArray(answer)) return false;
    const chosen = new Set(answer);
    if (chosen.size !== correctIds.size) return false;
    for (const c of correctIds) if (!chosen.has(c)) return false;
    return true;
  }
  if (q.type === "fill_blank") {
    if (typeof answer !== "string" || !answer.trim()) return false;
    const norm = normalizeAnswerText(answer);
    return q.options.some((o) => o.isCorrect && normalizeAnswerText(o.text) === norm);
  }
  return false;
}

export function ExerciseRunner({ questions }: { questions: RunnerQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showResults, setShowResults] = useState(false);

  function setSingle(qid: string, oid: string) {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [qid]: [oid] }));
  }
  function toggleMulti(qid: string, oid: string) {
    if (showResults) return;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : [];
      return { ...prev, [qid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
    });
  }
  function setText(qid: string, t: string) {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [qid]: t }));
  }

  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;

  let scoreEarned = 0;
  let scoreMax = 0;
  if (showResults) {
    for (const q of questions) {
      scoreMax += q.points;
      if (gradeQuestion(q, answers[q.id])) scoreEarned += q.points;
    }
  }
  const score20 = showResults ? scoreOutOf20(scoreEarned, scoreMax) : 0;
  const isPassing = score20 >= 10;

  return (
    <div className="space-y-5">
      {showResults ? (
        <Card
          className={cn(
            "border-2 p-6 text-center",
            isPassing ? "border-success" : "border-destructive"
          )}
        >
          <p className={cn("text-base font-bold", isPassing ? "text-success" : "text-destructive")}>Résultat</p>
          <p className={cn("mt-1 text-5xl font-extrabold leading-none", isPassing ? "text-success" : "text-destructive")}>
            {score20.toFixed(2)}
            <span className="text-xl font-medium text-muted-foreground">/20</span>
          </p>
          <p className="mt-2 text-muted-foreground">{getAppreciation(score20)}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => {
              setAnswers({});
              setShowResults(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <RotateCcw className="size-4" />
            Recommencer
          </Button>
        </Card>
      ) : null}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i + 1}
            answer={answers[q.id]}
            showResult={showResults}
            onSetSingle={(oid) => setSingle(q.id, oid)}
            onToggleMulti={(oid) => toggleMulti(q.id, oid)}
            onSetText={(t) => setText(q.id, t)}
          />
        ))}
      </div>

      {!showResults ? (
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => {
            setShowResults(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Send className="size-4" />
          Vérifier mes réponses {answeredCount < questions.length ? `(${answeredCount}/${questions.length})` : ""}
        </Button>
      ) : null}
    </div>
  );
}

function QuestionCard({
  question: q,
  index,
  answer,
  showResult,
  onSetSingle,
  onToggleMulti,
  onSetText,
}: {
  question: RunnerQuestion;
  index: number;
  answer: Answer;
  showResult: boolean;
  onSetSingle: (oid: string) => void;
  onToggleMulti: (oid: string) => void;
  onSetText: (t: string) => void;
}) {
  const isMulti = q.type === "qcm_multiple";
  const isChoice = q.type === "qcm_single" || isMulti || q.type === "matching";
  const resultCorrect = showResult && gradeQuestion(q, answer);

  return (
    <Card
      className={cn(
        "p-5 transition-colors",
        showResult && (resultCorrect ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5")
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 leading-snug">
          <span className="mr-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            Q{index}
          </span>
          <span className="font-medium">{q.text}</span>
        </p>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {q.points} {q.points > 1 ? "pts" : "pt"}
        </span>
      </div>

      <div className="mt-3">
        {q.type === "true_false" || q.type === "qcm_single" || q.type === "qcm_multiple" || q.type === "matching" ? (
          <div className="space-y-2">
            {q.options.map((o, i) => {
              const checked = isMulti
                ? Array.isArray(answer) && answer.includes(o.id)
                : Array.isArray(answer) && answer[0] === o.id;
              const correctness = showResult
                ? o.isCorrect
                  ? "correct"
                  : checked
                    ? "wrong"
                    : "neutral"
                : "neutral";
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={showResult}
                  onClick={() => (isMulti ? onToggleMulti(o.id) : onSetSingle(o.id))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors",
                    showResult ? "cursor-default" : "hover:border-primary/40 hover:bg-muted/40",
                    checked && !showResult ? "border-primary bg-primary/5" : "border-border",
                    showResult && correctness === "correct" && "border-success bg-success/10",
                    showResult && correctness === "wrong" && "border-destructive bg-destructive/10"
                  )}
                >
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {LETTERS[i] ?? String(i + 1)})
                  </span>
                  <span className="flex-1">{o.text}</span>
                  {isChoice && showResult && correctness === "correct" ? (
                    <Check className="size-4 shrink-0 text-success" />
                  ) : null}
                  {isChoice && showResult && correctness === "wrong" ? (
                    <X className="size-4 shrink-0 text-destructive" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {q.type === "fill_blank" ? (
          <div className="space-y-2">
            <Input
              value={typeof answer === "string" ? answer : ""}
              onChange={(e) => onSetText(e.target.value)}
              disabled={showResult}
              placeholder="Votre réponse…"
              className={cn(
                "max-w-md",
                showResult && resultCorrect && "border-success",
                showResult && !resultCorrect && "border-destructive"
              )}
            />
            {showResult && !resultCorrect ? (
              <p className="text-xs text-muted-foreground">
                Réponse(s) attendue(s) :{" "}
                <span className="font-medium text-success">
                  {q.options
                    .filter((o) => o.isCorrect)
                    .map((o) => o.text)
                    .join(" / ")}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {showResult ? (
          <div className="mt-3">
            {resultCorrect ? (
              <Badge variant="success" className="gap-1">
                <Check className="size-3" />
                Bonne réponse
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="size-3" />
                À revoir
              </Badge>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
