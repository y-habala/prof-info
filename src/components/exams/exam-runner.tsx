"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleDot,
  ListChecks,
  ToggleLeft,
  Link2,
  PenLine,
  AlignLeft,
  Award,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const TYPE_LABELS: Record<string, string> = {
  qcm_single: "Choix unique",
  qcm_multiple: "Choix multiple",
  true_false: "Vrai ou faux",
  matching: "Association",
  fill_blank: "Texte à trous",
  open: "Réponse libre",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  qcm_single: CircleDot,
  qcm_multiple: ListChecks,
  true_false: ToggleLeft,
  matching: Link2,
  fill_blank: PenLine,
  open: AlignLeft,
};

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
  label,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  type: "radio" | "checkbox";
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border p-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
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
      <span className="flex-1 leading-snug">{label}</span>
    </label>
  );
}

function QuestionCard({
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
  const isChoice =
    q.questionType === "qcm_single" || q.questionType === "true_false" || q.questionType === "qcm_multiple";
  const isMulti = q.questionType === "qcm_multiple";
  const TypeIcon = TYPE_ICONS[q.questionType] ?? CircleDot;
  // A stable reference (not a fresh array literal on every keystroke across
  // the whole exam) — Base UI's Select re-syncs its internal selected-index
  // state off `items`/`value` together, and a new `items` identity on every
  // unrelated re-render was enough to make it misreport this Select as
  // having started uncontrolled.
  const matchingItems = useMemo(
    () => [{ value: null, label: "Choisissez une réponse…" }, ...q.options.map((o) => ({ value: o.id, label: o.text }))],
    [q.options]
  );

  return (
    <Card className="rounded-2xl border-border py-5 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {index + 1}
          </span>
          <div className="flex-1 space-y-1.5">
            <CardTitle className="text-base leading-snug font-semibold">{q.questionText}</CardTitle>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <TypeIcon className="size-3.5 text-primary/70" />
                {TYPE_LABELS[q.questionType] ?? q.questionType}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="size-3.5 text-gold-foreground" />
                {q.points} {q.points > 1 ? "pts" : "pt"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-2",
          isChoice && q.options.length === 2 && "grid grid-cols-2 gap-2 space-y-0"
        )}
      >
        {isChoice &&
          q.options.map((o) => (
            <ChoiceOption
              key={o.id}
              name={q.id}
              type={isMulti ? "checkbox" : "radio"}
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
        {q.questionType === "matching" && (
          <Select
            disabled={isSubmitting}
            // Without `items`, Base UI's <Select.Value> renders the raw
            // value instead of the matching option's label. The `value: null`
            // entry matters just as much: without an item that actually
            // matches a `null` value, Base UI treats "no match found" as
            // unresolved and silently snaps selectedIndex (and then the
            // controlled value, via its mount-time sync) to the first real
            // item — i.e. an unanswered question would auto-grade as
            // whatever option happens to render first.
            items={matchingItems}
            // Base UI's Select decides controlled-vs-uncontrolled from
            // whether `value` is `undefined` on the first render — an
            // unanswered question must still pass a defined `null`, never
            // `undefined`, or it starts uncontrolled and then flips
            // (triggering a dev warning and breaking the label lookup) the
            // moment an answer is picked.
            value={Array.isArray(answer) ? (answer[0] ?? null) : null}
            onValueChange={(value) => onSetSingle(value as string)}
          >
            <SelectTrigger className="w-full max-w-xs rounded-lg">
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
            className="rounded-lg"
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
      </CardContent>
    </Card>
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
    <div className="student-theme min-h-screen bg-muted/20">
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
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {sections.map((section, sIndex) => (
          <div key={section.id ?? "unsectioned"} className="space-y-4">
            {section.title ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {sIndex + 1}
                  </span>
                  <h2 className="text-xl font-extrabold tracking-tight">{section.title}</h2>
                </div>
                {section.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL
                  <img
                    src={section.imageUrl}
                    alt=""
                    className="max-h-80 w-full rounded-2xl border border-border object-contain shadow-sm"
                  />
                ) : null}
              </div>
            ) : null}
            <div className="space-y-4">
              {section.questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  answer={answers[q.id]}
                  isSubmitting={isSubmitting}
                  onSetSingle={(optionId) => setSingleAnswer(q.id, optionId)}
                  onToggleMulti={(optionId) => toggleMultiAnswer(q.id, optionId)}
                  onSetText={(text) => setTextAnswer(q.id, text)}
                />
              ))}
            </div>
          </div>
        ))}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="h-11 w-full rounded-full text-base font-bold"
        >
          {isSubmitting ? "Envoi..." : "Valider l'examen"}
        </Button>
      </div>
    </div>
  );
}
