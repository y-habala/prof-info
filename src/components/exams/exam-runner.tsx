"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send, Loader2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExamTimer } from "./exam-timer";
import { ExamReloadWarning } from "./exam-reload-warning";
import type { ExamQuestionType } from "@/schemas/exams";
import { isInteractive, type InteractivePayload } from "@/lib/exam-interactive";
import { BoxesInput, OrderingInput, TableInput, interactiveAnswered } from "./interactive-inputs";

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

type Answers = Record<string, string[] | string>;

// One accent colour (the platform blue) everywhere: it marks what the
// student chose, nothing else. Exercises are set apart by layout, not colour.
const LETTERS = "abcdefghij";

function isFauxOption(text: string) {
  const t = text.trim().toLowerCase();
  return t === "faux" || t === "false" || t === "non";
}

function isAnswered(q: Question, a: string[] | string | undefined): boolean {
  if (isInteractive(q.type)) return interactiveAnswered(q.type, typeof a === "string" ? a : undefined);
  if (q.type === "fill_blank") return typeof a === "string" && a.trim().length > 0;
  return Array.isArray(a) && a.length > 0;
}

/** Question number: grey while to do, blue with a check once answered. */
function Num({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
        done ? "bg-primary text-primary-foreground" : "border border-slate-300 text-slate-500"
      )}
    >
      {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
    </span>
  );
}

const flash = "rounded-lg transition-shadow data-[flash=true]:ring-2 data-[flash=true]:ring-primary/40";

/* ── Vrai / Faux ── */
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
  const done = isAnswered(q, answer);
  const selected = Array.isArray(answer) ? answer[0] : undefined;
  // "Vrai" always first, then "Faux".
  const ordered = [...q.options].sort((a, b) => Number(isFauxOption(a.text)) - Number(isFauxOption(b.text)));
  return (
    <div
      data-q={q.id}
      data-done={done}
      className={cn("flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6", flash)}
    >
      <p className="flex gap-3 text-base font-semibold leading-relaxed text-slate-950">
        <Num n={n} done={done} />
        <span>{q.text}</span>
      </p>
      <div className="flex shrink-0 gap-2 pl-9 sm:pl-0">
        {ordered.map((o) => {
          const on = selected === o.id;
          const faux = isFauxOption(o.text);
          return (
            <label
              key={o.id}
              className={cn(
                "min-w-20 cursor-pointer rounded-full border-2 px-5 py-2 text-center text-sm font-bold transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1",
                disabled && "pointer-events-none opacity-60",
                on
                  ? faux
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-emerald-600 bg-emerald-600 text-white"
                  : faux
                    ? "border-slate-300 bg-white text-slate-800 hover:border-rose-400 hover:text-rose-700"
                    : "border-slate-300 bg-white text-slate-800 hover:border-emerald-500 hover:text-emerald-700"
              )}
            >
              <input type="radio" name={q.id} checked={on} disabled={disabled} onChange={() => onPick(o.id)} className="sr-only" />
              {o.text}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ── Appariement (liste déroulante) ── */
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
  // A bare number is a label on a diagram.
  const numbered = /^\s*\d{1,3}\s*$/.test(q.text);
  return (
    <label data-q={q.id} data-done={!!value} className={cn("flex gap-3", numbered ? "items-center" : "flex-col gap-1.5", flash)}>
      {numbered ? (
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            value ? "bg-primary text-primary-foreground" : "bg-slate-800 text-white"
          )}
        >
          {q.text.trim()}
        </span>
      ) : (
        <span className="text-base font-semibold text-slate-950">{q.text}</span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        className={cn(
          "h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-[15px] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          value
            ? "border-2 border-primary bg-primary/5 font-bold text-primary"
            : "border-2 border-slate-300 font-medium text-slate-600"
        )}
      >
        {/* Options are styled on their own so the open list reads sharp and
            dark, whatever colour the closed select shows. */}
        <option value="" className="bg-white font-normal text-slate-500">
          Choisir…
        </option>
        {q.options.map((o) => (
          <option key={o.id} value={o.id} className="bg-white font-bold text-slate-900">
            {o.text}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ── QCM ── */
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
    <fieldset data-q={q.id} data-done={chosen.length > 0} className={cn("space-y-2", flash)}>
      <legend className="mb-2 flex gap-3 text-base font-semibold leading-snug text-slate-950">
        <Num n={n} done={chosen.length > 0} />
        <span>
          {q.text}
          {multi ? <span className="ml-1 text-xs font-normal text-slate-500">(plusieurs réponses)</span> : null}
        </span>
      </legend>
      <div className="space-y-1.5 pl-9">
        {q.options.map((o, i) => {
          const on = chosen.includes(o.id);
          return (
            <label
              key={o.id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 text-[15px] font-medium transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                on
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-slate-300 bg-white text-slate-900 hover:border-primary/60",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={q.id}
                checked={on}
                disabled={disabled}
                onChange={() => (multi ? onToggleMulti(o.id) : onSetSingle(o.id))}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center text-xs font-bold",
                  multi ? "rounded-md" : "rounded-full",
                  on ? "bg-white text-primary" : "border-2 border-slate-300 text-slate-600"
                )}
              >
                {on ? <Check className="size-3.5" strokeWidth={3} /> : LETTERS[i] ?? i + 1}
              </span>
              <span className="leading-snug">{o.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── Other types (texte à trous, boîtes, tableau…) ── */
function BlockQuestion({
  q,
  n,
  answer,
  disabled,
  onSetText,
}: {
  q: Question;
  n: number;
  answer: string[] | string | undefined;
  disabled: boolean;
  onSetText: (text: string) => void;
}) {
  const text = typeof answer === "string" ? answer : undefined;
  const done = isAnswered(q, answer);
  return (
    <div data-q={q.id} data-done={done} className={cn("space-y-3 py-3.5", flash)}>
      <p className="flex gap-3 text-base font-semibold leading-relaxed text-slate-950">
        <Num n={n} done={done} />
        <span>{q.text}</span>
      </p>
      <div className="sm:pl-9">
        {q.interactive && q.type === "boxes" ? (
          <BoxesInput payload={q.interactive} value={text} disabled={disabled} onChange={onSetText} />
        ) : null}
        {q.interactive && q.type === "ordering" ? (
          <OrderingInput payload={q.interactive} value={text} disabled={disabled} onChange={onSetText} />
        ) : null}
        {q.interactive && q.type === "table" ? (
          <TableInput payload={q.interactive} value={text} disabled={disabled} onChange={onSetText} />
        ) : null}
        {q.type === "fill_blank" ? (
          <Input
            disabled={disabled}
            value={text ?? ""}
            onChange={(e) => onSetText(e.target.value)}
            placeholder="Ta réponse…"
            className={cn(
              "h-11 max-w-md border-2 border-slate-300 text-[15px] text-slate-800",
              text?.trim() && "border-primary font-bold text-primary"
            )}
          />
        ) : null}
      </div>
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

function sectionHeading(title: string | null): string {
  const t = (title ?? "").trim();
  // "Exercice 2 : Reliez…" → "Reliez…" (the number is shown separately).
  return t.replace(/^exercice\s*\d+\s*[:\-–]\s*/i, "") || "Questions";
}

const fmtPoints = (p: number) => `${Number.isInteger(p) ? p : p.toFixed(2).replace(/0$/, "")} Pt${p > 1 ? "s" : ""}`;

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
  answers: Answers;
  disabled: boolean;
  onSetSingle: (qId: string, optionId: string) => void;
  onToggleMulti: (qId: string, optionId: string) => void;
  onSetText: (qId: string, text: string) => void;
}) {
  const totalPoints = section.questions.reduce((s, q) => s + q.points, 0);
  const groups = groupByLayout(section.questions);

  return (
    <section
      id={`exercice-${index}`}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 border-t-4 border-t-primary bg-white shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
        <h2 className="min-w-0 text-[17px] leading-snug text-slate-900">
          <span className="font-heading font-bold">Exercice {index} :</span>{" "}
          <span className="font-semibold">{sectionHeading(section.title)}</span>
        </h2>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {fmtPoints(totalPoints)}
        </span>
      </header>

      {section.imageUrl ? (
        <div className="border-b border-slate-100 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" className="mx-auto max-h-[480px] w-full object-contain" />
        </div>
      ) : null}

      <div className="space-y-4 px-5 py-4 sm:px-6">
        {groups.map((g) => {
          if (g.layout === "tf") {
            return (
              <div key="tf" className="divide-y divide-slate-100">
                {g.items.map(({ q, n }) => (
                  <TfRow key={q.id} q={q} n={n} answer={answers[q.id]} disabled={disabled} onPick={(id) => onSetSingle(q.id, id)} />
                ))}
              </div>
            );
          }
          if (g.layout === "match") {
            return (
              <div key="match" className="grid grid-cols-1 gap-x-6 gap-y-4 py-2 sm:grid-cols-2">
                {g.items.map(({ q }) => (
                  <MatchBox key={q.id} q={q} answer={answers[q.id]} disabled={disabled} onPick={(id) => onSetSingle(q.id, id)} />
                ))}
              </div>
            );
          }
          if (g.layout === "qcm") {
            return (
              <div key="qcm" className="grid grid-cols-1 gap-x-8 gap-y-6 py-2 md:grid-cols-2">
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
            <div key="block" className="divide-y divide-slate-100">
              {g.items.map(({ q, n }) => (
                <BlockQuestion
                  key={q.id}
                  q={q}
                  n={n}
                  answer={answers[q.id]}
                  disabled={disabled}
                  onSetText={(text) => onSetText(q.id, text)}
                />
              ))}
            </div>
          );
        })}
      </div>
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
  const [answers, setAnswers] = useState<Answers>({});
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
  const remaining = allQuestions.length - answeredCount;
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

  async function submit() {
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

  function highlight(el: HTMLElement) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.dataset.flash = "true";
    setTimeout(() => {
      el.dataset.flash = "false";
    }, 1500);
  }

  // Next question still to answer, after the one in view.
  function goToNextUnanswered() {
    const todo = [...document.querySelectorAll<HTMLElement>('[data-q][data-done="false"]')];
    if (todo.length === 0) return;
    highlight(todo.find((el) => el.getBoundingClientRect().top > 110) ?? todo[0]);
  }

  // The student confirms before handing in with gaps (and is taken to the
  // first one if they go back); the timer hands in without asking.
  function submitByStudent() {
    if (remaining > 0) {
      const ok = confirm(
        `Il te reste ${remaining} question${remaining > 1 ? "s" : ""} sans réponse.\n\nOK = terminer\nAnnuler = revenir aux questions`
      );
      if (!ok) {
        const first = document.querySelector<HTMLElement>('[data-q][data-done="false"]');
        if (first) highlight(first);
        return;
      }
    }
    submit();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ExamReloadWarning />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-heading text-base font-semibold text-slate-900 sm:text-lg">{examTitle}</h1>
            <p className="truncate text-xs text-slate-500">
              {levelName ? `${levelName} · ` : ""}Informatique · Modèle {modelLabel.toUpperCase()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {remaining > 0 ? (
              <button
                type="button"
                onClick={goToNextUnanswered}
                title="Aller à la prochaine question sans réponse"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ChevronDown className="size-4" />
                <span className="tabular-nums">{remaining}</span>
                <span className="hidden md:inline">à faire</span>
              </button>
            ) : null}
            <ExamTimer deadline={deadline} onExpire={submit} />
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitByStudent}
              aria-label="Terminer l'examen"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:px-4"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span className="hidden sm:inline">Terminer</span>
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-slate-100">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
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

        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-slate-500">
            {answeredCount}/{allQuestions.length} questions répondues
          </p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={submitByStudent}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            Valider l&apos;examen
          </button>
          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
