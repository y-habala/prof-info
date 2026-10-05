"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExamTimer } from "./exam-timer";
import type { ExamQuestionType } from "@/schemas/exams";

type Question = {
  id: string;
  text: string;
  type: ExamQuestionType;
  points: number;
  options: { id: string; text: string }[];
};

export type SectionGroup = {
  id: string | null;
  title: string | null;
  imageUrl: string | null;
  questions: Question[];
};

const LETTERS = "abcdefghij";

function isVraiOption(text: string) {
  const t = text.trim().toLowerCase();
  return t === "vrai" || t === "true" || t === "oui";
}
function isFauxOption(text: string) {
  const t = text.trim().toLowerCase();
  return t === "faux" || t === "false" || t === "non";
}

function isAnswered(q: Question, a: string[] | string | undefined): boolean {
  if (q.type === "fill_blank") return typeof a === "string" && a.trim().length > 0;
  return Array.isArray(a) && a.length > 0;
}

function ChoiceOption({
  name,
  type,
  letter,
  label,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  type: "radio" | "checkbox";
  letter: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-all",
        "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
        disabled ? "pointer-events-none opacity-60" : "border-border hover:border-primary/40 hover:bg-muted/40"
      )}
    >
      <input
        type={type}
        name={type === "radio" ? name : undefined}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border-2 border-muted-foreground/40 text-transparent transition-colors",
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          type === "radio" ? "rounded-full after:size-2.5 after:rounded-full after:bg-current" : "rounded-md"
        )}
      >
        {type === "checkbox" ? <Check className="size-4" strokeWidth={3} /> : null}
      </span>
      <span className="font-mono text-xs font-bold text-muted-foreground">{letter})</span>
      <span className="flex-1 leading-snug">{label}</span>
    </label>
  );
}

function TrueFalsePills({
  options,
  name,
  answer,
  disabled,
  onChange,
}: {
  options: { id: string; text: string }[];
  name: string;
  answer: string[] | string | undefined;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const selected = Array.isArray(answer) ? answer[0] : undefined;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const isVrai = isVraiOption(o.text) || (!isFauxOption(o.text) && i === 0);
        const checked = selected === o.id;
        return (
          <label
            key={o.id}
            className={cn(
              "cursor-pointer rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all",
              disabled ? "pointer-events-none opacity-60" : "",
              checked
                ? isVrai
                  ? "border-success bg-success text-success-foreground shadow-sm"
                  : "border-destructive bg-destructive text-destructive-foreground shadow-sm"
                : "border-border hover:border-foreground/40"
            )}
          >
            <input type="radio" name={name} checked={checked} disabled={disabled} onChange={() => onChange(o.id)} className="sr-only" />
            {o.text}
          </label>
        );
      })}
    </div>
  );
}

function QuestionCard({
  question: q,
  index,
  answer,
  disabled,
  onSetSingle,
  onToggleMulti,
  onSetText,
}: {
  question: Question;
  index: number;
  answer: string[] | string | undefined;
  disabled: boolean;
  onSetSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onSetText: (text: string) => void;
}) {
  const isMulti = q.type === "qcm_multiple";
  const isChoice = q.type === "qcm_single" || isMulti || q.type === "matching";

  return (
    <div className="space-y-3 p-5">
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

      {q.type === "true_false" && (
        <TrueFalsePills options={q.options} name={q.id} answer={answer} disabled={disabled} onChange={onSetSingle} />
      )}

      {isChoice && q.type !== "true_false" && (
        <div className="space-y-2">
          {q.options.map((o, i) => (
            <ChoiceOption
              key={o.id}
              name={q.id}
              type={isMulti ? "checkbox" : "radio"}
              letter={LETTERS[i] ?? String(i + 1)}
              label={o.text}
              disabled={disabled}
              checked={
                isMulti ? Array.isArray(answer) && answer.includes(o.id) : Array.isArray(answer) && answer[0] === o.id
              }
              onChange={() => (isMulti ? onToggleMulti(o.id) : onSetSingle(o.id))}
            />
          ))}
        </div>
      )}

      {q.type === "fill_blank" && (
        <Input
          disabled={disabled}
          value={typeof answer === "string" ? answer : ""}
          onChange={(e) => onSetText(e.target.value)}
          placeholder="Votre réponse…"
          className="max-w-md"
        />
      )}
    </div>
  );
}

function SectionCard({
  section,
  startIndex,
  answers,
  disabled,
  onSetSingle,
  onToggleMulti,
  onSetText,
}: {
  section: SectionGroup;
  startIndex: number;
  answers: Record<string, string[] | string>;
  disabled: boolean;
  onSetSingle: (qId: string, optionId: string) => void;
  onToggleMulti: (qId: string, optionId: string) => void;
  onSetText: (qId: string, text: string) => void;
}) {
  const totalPoints = section.questions.reduce((s, q) => s + q.points, 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-border border-t-4 border-t-primary bg-card shadow-xs">
      {section.title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
          <h2 className="font-bold">{section.title}</h2>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {totalPoints} {totalPoints > 1 ? "pts" : "pt"}
          </span>
        </div>
      ) : null}
      {section.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={section.imageUrl} alt="" className="max-h-80 w-full border-b border-border object-contain p-3" />
      ) : null}
      <div className="divide-y divide-border">
        {section.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={startIndex + i}
            answer={answers[q.id]}
            disabled={disabled}
            onSetSingle={(oid) => onSetSingle(q.id, oid)}
            onToggleMulti={(oid) => onToggleMulti(q.id, oid)}
            onSetText={(t) => onSetText(q.id, t)}
          />
        ))}
      </div>
    </div>
  );
}

export function ExamRunner({
  attemptId,
  examTitle,
  modelLabel,
  deadline,
  sections,
}: {
  attemptId: string;
  examTitle: string;
  modelLabel: string;
  deadline: number;
  sections: SectionGroup[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);
  const unloadGuardRef = useRef(true);

  // Anti-cheat: block reload/back/close with the browser's native dialog.
  // Disabled right before router.push(.../resultat) on a successful submit.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!unloadGuardRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const allQuestions = sections.flatMap((s) => s.questions);
  const answeredCount = allQuestions.filter((q) => isAnswered(q, answers[q.id])).length;
  const progress = allQuestions.length > 0 ? Math.round((answeredCount / allQuestions.length) * 100) : 0;

  function setSingle(qid: string, oid: string) {
    setAnswers((prev) => ({ ...prev, [qid]: [oid] }));
  }
  function toggleMulti(qid: string, oid: string) {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : [];
      return { ...prev, [qid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
    });
  }
  function setText(qid: string, t: string) {
    setAnswers((prev) => ({ ...prev, [qid]: t }));
  }

  async function handleSubmit() {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      answers: allQuestions.map((q) => {
        const a = answers[q.id];
        if (q.type === "fill_blank") return { questionId: q.id, text: typeof a === "string" ? a : "" };
        return { questionId: q.id, optionIds: Array.isArray(a) ? a : [] };
      }),
    };

    try {
      const res = await fetch(`/api/exam/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Une erreur est survenue.");
        hasSubmittedRef.current = false;
        setIsSubmitting(false);
        return;
      }
      unloadGuardRef.current = false;
      router.push(`/exam/${attemptId}/resultat`);
    } catch {
      setError("Une erreur est survenue.");
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
    }
  }

  // Compute continuous question numbering across sections
  const sectionStartIndexes: number[] = [];
  let cursor = 1;
  for (const s of sections) {
    sectionStartIndexes.push(cursor);
    cursor += s.questions.length;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{examTitle}</h1>
            <p className="text-xs text-primary-foreground/80">Modèle {modelLabel.toUpperCase()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-medium text-primary-foreground/80 sm:inline">
              {answeredCount}/{allQuestions.length}
            </span>
            <ExamTimer deadline={deadline} onExpire={handleSubmit} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="rounded-full gap-1.5"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Terminer
            </Button>
          </div>
        </div>
        <div className="h-1 w-full bg-primary-foreground/15">
          <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:py-8">
        {sections.map((s, i) => (
          <SectionCard
            key={s.id ?? "unsectioned"}
            section={s}
            startIndex={sectionStartIndexes[i]}
            answers={answers}
            disabled={isSubmitting}
            onSetSingle={setSingle}
            onToggleMulti={toggleMulti}
            onSetText={setText}
          />
        ))}
        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="button" disabled={isSubmitting} onClick={handleSubmit} size="lg" className="w-full gap-2">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Valider l&apos;examen
        </Button>
      </main>
    </div>
  );
}
