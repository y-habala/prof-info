"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExamTimer } from "./exam-timer";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
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

function isAnswered(q: Question, answer: string[] | string | undefined): boolean {
  if (q.questionType === "fill_blank" || q.questionType === "open") {
    return typeof answer === "string" && answer.trim().length > 0;
  }
  return Array.isArray(answer) && answer.length > 0;
}

// A real <input>, visually hidden (not display:none, so it stays focusable
// and keyboard/screen-reader operable) with the visible pill driven purely
// by CSS :has()/peer state — no extra React state beyond the existing
// answers map.
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
        "flex cursor-pointer items-center gap-2.5 rounded-lg border-2 border-border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
        disabled ? "pointer-events-none opacity-60" : "hover:border-primary/40 hover:bg-muted/40"
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
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border-2 border-muted-foreground/40 text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          type === "radio" ? "rounded-full after:size-2 after:rounded-full after:bg-current" : "rounded-[6px]"
        )}
      >
        {type === "checkbox" ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="font-semibold text-muted-foreground">{letter})</span>
      <span className="flex-1 leading-snug">{label}</span>
    </label>
  );
}

// Compact inline Vrai/Faux pill pair, color-coded by meaning (green/red) —
// mirrors the reference exam file's own .radio-label.vrai/.faux treatment,
// not a generic choice-card. Matched to the real option by text first
// ("Vrai"/"Faux"/"Oui"/"Non"/english), falling back to position (index 0 =
// vrai-styled, 1 = faux-styled) since every true_false question in this
// app always has exactly 2 admin-authored options.
function TrueFalseToggle({
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
  onChange: (optionId: string) => void;
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
              "cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors",
              disabled ? "pointer-events-none opacity-60" : "",
              checked
                ? isVrai
                  ? "border-success bg-success text-success-foreground"
                  : "border-destructive bg-destructive text-white"
                : "border-border text-muted-foreground hover:border-muted-foreground/60"
            )}
          >
            <input
              type="radio"
              name={name}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            {o.text}
          </label>
        );
      })}
    </div>
  );
}

function QuestionRow({
  question: q,
  index,
  answer,
  isSubmitting,
  onSetSingle,
  onToggleMulti,
  onSetText,
}: {
  question: Question;
  index: number;
  answer: string[] | string | undefined;
  isSubmitting: boolean;
  onSetSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onSetText: (text: string) => void;
}) {
  const isMulti = q.questionType === "qcm_multiple";
  const isChoice = q.questionType === "qcm_single" || isMulti;

  return (
    <div className="space-y-2.5 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm leading-snug font-medium">
          <span className="font-bold text-primary">{index + 1}.</span> {q.questionText}
        </p>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {q.points} {q.points > 1 ? "pts" : "pt"}
        </span>
      </div>

      {q.questionType === "true_false" && (
        <TrueFalseToggle
          options={q.options}
          name={q.id}
          answer={answer}
          disabled={isSubmitting}
          onChange={onSetSingle}
        />
      )}

      {isChoice && (
        <div className="space-y-1.5">
          {q.options.map((o, i) => (
            <ChoiceOption
              key={o.id}
              name={q.id}
              type={isMulti ? "checkbox" : "radio"}
              letter={LETTERS[i] ?? String(i + 1)}
              label={o.text}
              disabled={isSubmitting}
              checked={
                isMulti
                  ? Array.isArray(answer) && answer.includes(o.id)
                  : Array.isArray(answer) && answer[0] === o.id
              }
              onChange={() => (isMulti ? onToggleMulti(o.id) : onSetSingle(o.id))}
            />
          ))}
        </div>
      )}

      {q.questionType === "matching" && (
        <Select
          disabled={isSubmitting}
          // Without `items`, Base UI's <Select.Value> renders the raw value
          // instead of the matching option's label. The `value: null` entry
          // matters just as much: without an item that actually matches a
          // `null` value, Base UI treats "no match found" as unresolved and
          // silently snaps selectedIndex (and then the controlled value, via
          // its mount-time sync) to the first real item — i.e. an unanswered
          // question would auto-grade as whatever option happens to render
          // first. Built inline (not useMemo'd) since this row only
          // re-renders when its own answer changes, unlike the old
          // one-component-per-exam layout where every row re-rendered on
          // every keystroke anywhere in the exam.
          items={[{ value: null, label: "Choisissez une réponse…" }, ...q.options.map((o) => ({ value: o.id, label: o.text }))]}
          // Base UI's Select decides controlled-vs-uncontrolled from whether
          // `value` is `undefined` on the first render — an unanswered
          // question must still pass a defined `null`, never `undefined`.
          value={Array.isArray(answer) ? (answer[0] ?? null) : null}
          onValueChange={(value) => onSetSingle(value as string)}
        >
          <SelectTrigger className="w-full max-w-xs rounded-lg bg-muted/30">
            <SelectValue placeholder="Choisissez une réponse…" />
          </SelectTrigger>
          <SelectContent>
            {q.options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {q.questionType === "fill_blank" && (
        <Input
          disabled={isSubmitting}
          value={typeof answer === "string" ? answer : ""}
          onChange={(e) => onSetText(e.target.value)}
          placeholder="Votre réponse…"
          className="max-w-sm rounded-lg"
        />
      )}

      {q.questionType === "open" && (
        <Textarea
          rows={3}
          disabled={isSubmitting}
          value={typeof answer === "string" ? answer : ""}
          onChange={(e) => onSetText(e.target.value)}
          placeholder="Votre réponse…"
          className="rounded-lg"
        />
      )}
    </div>
  );
}

// One bordered, top-accented card per section — mirrors the reference exam
// file's .exercise-card (white card, colored top border strip, header row
// with title + a total-points badge), with individual questions as plain
// divided rows inside rather than a heavy card-per-question — the
// reference's own "exercise groups several light items" structure, not an
// app-generic "card grid."
function SectionCard({
  section,
  answers,
  isSubmitting,
  onSetSingle,
  onToggleMulti,
  onSetText,
}: {
  section: SectionGroup;
  answers: Record<string, string[] | string>;
  isSubmitting: boolean;
  onSetSingle: (questionId: string, optionId: string) => void;
  onToggleMulti: (questionId: string, optionId: string) => void;
  onSetText: (questionId: string, text: string) => void;
}) {
  const totalPoints = section.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border border-t-4 border-t-primary bg-card shadow-sm">
      {section.title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <h2 className="font-bold">{section.title}</h2>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {totalPoints} {totalPoints > 1 ? "pts" : "pt"}
          </span>
        </div>
      ) : null}
      {section.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL
        <img src={section.imageUrl} alt="" className="max-h-80 w-full border-b border-border object-contain p-3" />
      ) : null}
      <div className="divide-y divide-border">
        {section.questions.map((q, i) => (
          <QuestionRow
            key={q.id}
            question={q}
            index={i}
            answer={answers[q.id]}
            isSubmitting={isSubmitting}
            onSetSingle={(optionId) => onSetSingle(q.id, optionId)}
            onToggleMulti={(optionId) => onToggleMulti(q.id, optionId)}
            onSetText={(text) => onSetText(q.id, text)}
          />
        ))}
      </div>
    </div>
  );
}

export function ExamRunner({
  attemptId,
  examTitle,
  examDescription,
  deadline,
  sections,
}: {
  attemptId: string;
  examTitle: string;
  examDescription: string | null;
  deadline: number;
  sections: SectionGroup[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The timer's onExpire and the submit button's onClick can both reach
  // handleSubmit around the same instant; state alone can't guard against
  // that (both calls can read stale `isSubmitting` before either re-render
  // lands), so a ref gives a real synchronous re-entrancy check.
  const hasSubmittedRef = useRef(false);

  const allQuestions = sections.flatMap((s) => s.questions);
  const answeredCount = allQuestions.filter((q) => isAnswered(q, answers[q.id])).length;
  const progress = allQuestions.length > 0 ? Math.round((answeredCount / allQuestions.length) * 100) : 0;

  function setSingleAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  }

  function toggleMultiAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }

  function setTextAnswer(questionId: string, text: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  }

  async function handleSubmit() {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      answers: allQuestions.map((q) => {
        const a = answers[q.id];
        if (q.questionType === "fill_blank" || q.questionType === "open") {
          return { questionId: q.id, text: typeof a === "string" ? a : "" };
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
      router.push(`/exam/${attemptId}/resultat`);
    } catch {
      setError("Une erreur est survenue.");
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{examTitle}</h1>
            {examDescription ? (
              <p className="truncate text-sm text-primary-foreground/80">{examDescription}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-medium text-primary-foreground/80 sm:inline">
              {answeredCount}/{allQuestions.length} répondues
            </span>
            <ExamTimer deadline={deadline} onExpire={handleSubmit} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              Terminer
            </Button>
          </div>
        </div>
        <div className="h-1 w-full bg-primary-foreground/15">
          <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {sections.map((section) => (
          <SectionCard
            key={section.id ?? "unsectioned"}
            section={section}
            answers={answers}
            isSubmitting={isSubmitting}
            onSetSingle={setSingleAnswer}
            onToggleMulti={toggleMultiAnswer}
            onSetText={setTextAnswer}
          />
        ))}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button disabled={isSubmitting} onClick={handleSubmit} className="h-11 w-full rounded-full text-base font-bold">
          {isSubmitting ? "Envoi..." : "Valider l'examen"}
        </Button>
      </div>
    </div>
  );
}
