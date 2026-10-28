"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExamTimer } from "./exam-timer";
import { ExamReloadWarning } from "./exam-reload-warning";
import type { ExamQuestionType } from "@/schemas/exams";
import { isInteractive, type InteractivePayload } from "@/lib/exam-interactive";
import { AssociationInput, OrderingInput, TableInput, interactiveAnswered } from "./interactive-inputs";

type Question = {
  id: string;
  text: string;
  type: ExamQuestionType;
  points: number;
  options: { id: string; text: string }[];
  interactive?: InteractivePayload;
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
  if (isInteractive(q.type)) return interactiveAnswered(q.type, typeof a === "string" ? a : undefined);
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

      {q.interactive && q.type === "association" && (
        <AssociationInput payload={q.interactive} value={typeof answer === "string" ? answer : undefined} disabled={disabled} onChange={onSetText} />
      )}
      {q.interactive && q.type === "ordering" && (
        <OrderingInput payload={q.interactive} value={typeof answer === "string" ? answer : undefined} disabled={disabled} onChange={onSetText} />
      )}
      {q.interactive && q.type === "table" && (
        <TableInput payload={q.interactive} value={typeof answer === "string" ? answer : undefined} disabled={disabled} onChange={onSetText} />
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

type Layout = "tf" | "match" | "qcm" | "block";
const layoutOf = (q: Question): Layout =>
  q.type === "true_false"
    ? "tf"
    : q.type === "matching"
      ? "match"
      : q.type === "qcm_single" || q.type === "qcm_multiple"
        ? "qcm"
        : "block";

// Questions of the same kind are shown together, in the order the kinds
// first appear, so a shuffled section still reads like a paper exercise.
function groupByLayout(questions: Question[]) {
  const groups: { layout: Layout; items: { q: Question; n: number }[] }[] = [];
  for (const q of questions) {
    const layout = layoutOf(q);
    let g = groups.find((x) => x.layout === layout);
    if (!g) {
      g = { layout, items: [] };
      groups.push(g);
    }
    g.items.push({ q, n: 0 });
  }
  let n = 1;
  for (const g of groups) for (const it of g.items) it.n = n++;
  return groups;
}

function TfRow({
  q,
  n,
  answer,
  disabled,
  onPick,
}: {
  q: Question;
  n: number;
  answer: string[] | string | undefined;
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-snug">
        <span className="font-semibold">{n}.</span> {q.text}
      </p>
      <div className="shrink-0">
        <TrueFalsePills options={q.options} name={q.id} answer={answer} disabled={disabled} onChange={onPick} />
      </div>
    </div>
  );
}

function MatchBox({
  q,
  answer,
  disabled,
  onPick,
}: {
  q: Question;
  answer: string[] | string | undefined;
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  const value = Array.isArray(answer) ? (answer[0] ?? "") : "";
  // A bare number is a label on a diagram: shown as a numbered badge.
  const numbered = /^\s*\d{1,3}\s*$/.test(q.text);
  return (
    <label className={cn("flex gap-2.5 rounded-xl bg-muted/50 p-3", numbered ? "items-center" : "flex-col")}>
      {numbered ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {q.text.trim()}
        </span>
      ) : (
        <span className="text-sm font-semibold leading-snug">{q.text}</span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm",
          value ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        <option value="">…</option>
        {q.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.text}
          </option>
        ))}
      </select>
    </label>
  );
}

function QcmCard({
  q,
  n,
  answer,
  disabled,
  onSetSingle,
  onToggleMulti,
}: {
  q: Question;
  n: number;
  answer: string[] | string | undefined;
  disabled: boolean;
  onSetSingle: (id: string) => void;
  onToggleMulti: (id: string) => void;
}) {
  const multi = q.type === "qcm_multiple";
  const chosen = Array.isArray(answer) ? answer : [];
  return (
    <fieldset className="rounded-xl border border-border bg-card p-3.5">
      <legend className="sr-only">Question {n}</legend>
      <p className="mb-2 text-sm font-semibold leading-snug text-primary">
        {n}) {q.text}
        {multi ? <span className="ml-1 text-xs font-normal text-muted-foreground">(plusieurs réponses)</span> : null}
      </p>
      <div className="space-y-1">
        {q.options.map((o, i) => (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted/60",
              chosen.includes(o.id) && "bg-primary/10 font-medium",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <input
              type={multi ? "checkbox" : "radio"}
              name={q.id}
              checked={chosen.includes(o.id)}
              disabled={disabled}
              onChange={() => (multi ? onToggleMulti(o.id) : onSetSingle(o.id))}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <span>
              {LETTERS[i] ?? i + 1}) {o.text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function sectionHeading(title: string | null, index: number): [string, string] {
  const t = title ?? "Questions";
  const m = t.match(/^(exercice\s*\d+)\s*[:\-–]\s*(.*)$/i);
  return m ? [m[1], m[2]] : [`Exercice ${index}`, t];
}

function SectionCard({
  section,
  index,
  answers,
  disabled,
  onSetSingle,
  onToggleMulti,
  onSetText,
}: {
  section: SectionGroup;
  index: number;
  answers: Record<string, string[] | string>;
  disabled: boolean;
  onSetSingle: (qId: string, optionId: string) => void;
  onToggleMulti: (qId: string, optionId: string) => void;
  onSetText: (qId: string, text: string) => void;
}) {
  const totalPoints = section.questions.reduce((s, q) => s + q.points, 0);
  const groups = groupByLayout(section.questions);
  const [label, rest] = sectionHeading(section.title, index);

  return (
    <section className="overflow-hidden rounded-2xl border border-border border-t-[3px] border-t-primary bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-3">
        <h2 className="text-[15px] leading-snug">
          <span className="font-bold">{label} :</span> <span className="font-semibold">{rest}</span>
        </h2>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
          {totalPoints} {totalPoints > 1 ? "Pts" : "Pt"}
        </span>
      </div>

      {section.imageUrl ? (
        <div className="border-b border-border p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" className="mx-auto max-h-[480px] w-full rounded-lg object-contain" />
        </div>
      ) : null}

      {groups.map((g) => {
        if (g.layout === "tf") {
          return (
            <div key="tf" className="divide-y divide-border">
              {g.items.map(({ q, n }) => (
                <TfRow key={q.id} q={q} n={n} answer={answers[q.id]} disabled={disabled} onPick={(id) => onSetSingle(q.id, id)} />
              ))}
            </div>
          );
        }
        if (g.layout === "match") {
          return (
            <div key="match" className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {g.items.map(({ q }) => (
                <MatchBox key={q.id} q={q} answer={answers[q.id]} disabled={disabled} onPick={(id) => onSetSingle(q.id, id)} />
              ))}
            </div>
          );
        }
        if (g.layout === "qcm") {
          return (
            <div key="qcm" className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {g.items.map(({ q, n }) => (
                <QcmCard
                  key={q.id}
                  q={q}
                  n={n}
                  answer={answers[q.id]}
                  disabled={disabled}
                  onSetSingle={(id) => onSetSingle(q.id, id)}
                  onToggleMulti={(id) => onToggleMulti(q.id, id)}
                />
              ))}
            </div>
          );
        }
        return (
          <div key="block" className="divide-y divide-border">
            {g.items.map(({ q, n }) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={n}
                answer={answers[q.id]}
                disabled={disabled}
                onSetSingle={(oid) => onSetSingle(q.id, oid)}
                onToggleMulti={(oid) => onToggleMulti(q.id, oid)}
                onSetText={(text) => onSetText(q.id, text)}
              />
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function ExamRunner({
  attemptId,
  examTitle,
  levelName,
  modelLabel,
  deadline,
  sections,
}: {
  attemptId: string;
  examTitle: string;
  levelName: string | null;
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
        if (isInteractive(q.type)) {
          // An untouched ordering is still an answer: the order shown.
          const fallback = q.type === "ordering" ? JSON.stringify(q.interactive?.items.map((i) => i.id) ?? []) : "";
          return { questionId: q.id, text: typeof a === "string" ? a : fallback };
        }
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

  return (
    <div className="min-h-screen bg-muted/20">
      <ExamReloadWarning />
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-bold sm:text-xl">
              {examTitle} (Modèle {modelLabel.toUpperCase()})
            </h1>
            <p className="text-xs text-primary-foreground/80">
              {levelName ? `${levelName} | ` : ""}Informatique
            </p>
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

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        {sections.map((s, i) => (
          <SectionCard
            key={s.id ?? "unsectioned"}
            section={s}
            index={i + 1}
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
