"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Send,
  Loader2,
  CircleCheck,
  CircleDashed,
  ArrowDownToLine,
  Lightbulb,
  ToggleRight,
  ListChecks,
  Link2,
  Table2,
  PencilLine,
  Shuffle,
  PartyPopper,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
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

type Answers = Record<string, string[] | string>;

const LETTERS = "abcdefghij";

// One calm, distinct colour per exercise. Each card overrides --primary with
// its colour, so every accent inside it (numbers, selections, tables…)
// follows without per-component colour props.
const EXERCISE_COLORS = [
  { main: "oklch(0.5 0.17 255)", soft: "oklch(0.97 0.02 255)" }, // bleu
  { main: "oklch(0.52 0.11 185)", soft: "oklch(0.97 0.02 185)" }, // turquoise
  { main: "oklch(0.5 0.17 295)", soft: "oklch(0.97 0.02 295)" }, // violet
  { main: "oklch(0.58 0.14 55)", soft: "oklch(0.975 0.025 70)" }, // ambre
  { main: "oklch(0.55 0.17 15)", soft: "oklch(0.97 0.02 15)" }, // rose
  { main: "oklch(0.52 0.13 150)", soft: "oklch(0.97 0.025 150)" }, // vert
];
const colorOf = (i: number) => EXERCISE_COLORS[i % EXERCISE_COLORS.length];
const themeVars = (i: number) =>
  ({ "--primary": colorOf(i).main, "--ring": colorOf(i).main, "--ex-soft": colorOf(i).soft }) as React.CSSProperties;

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

// Every question carries its state so the student never loses one:
// orange frame = still to answer, green frame = answered.
const stateFrame = (done: boolean) =>
  cn(
    "border-l-[3px] transition-[border-color,box-shadow] duration-300 data-[flash=true]:ring-4 data-[flash=true]:ring-amber-300/70",
    done ? "border-l-emerald-400" : "border-l-amber-300"
  );

/* ── Vrai / Faux ── */
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
  // "Vrai" always first, then "Faux", whatever order the options come in.
  const ordered = [...options].sort((a, b) => Number(isFauxOption(a.text)) - Number(isFauxOption(b.text)));
  return (
    <div className="flex gap-2">
      {ordered.map((o, i) => {
        const isVrai = isVraiOption(o.text) || (!isFauxOption(o.text) && i === 0);
        const checked = selected === o.id;
        return (
          <label
            key={o.id}
            className={cn(
              "inline-flex min-w-24 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-[15px] font-bold transition-all duration-200 active:scale-95",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
              disabled && "pointer-events-none opacity-60",
              checked
                ? isVrai
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_8px_rgb(16_185_129/0.35)]"
                  : "border-rose-500 bg-rose-500 text-white shadow-[0_2px_8px_rgb(244_63_94/0.35)]"
                : isVrai
                  ? "border-emerald-200 bg-card text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                  : "border-rose-200 bg-card text-rose-700 hover:border-rose-400 hover:bg-rose-50"
            )}
          >
            <input type="radio" name={name} checked={checked} disabled={disabled} onChange={() => onChange(o.id)} className="sr-only" />
            {isVrai ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}
            {o.text}
          </label>
        );
      })}
    </div>
  );
}

function Num({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={cn(
        "mt-px flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
        done ? "scale-105 bg-emerald-500 text-white" : "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
      )}
    >
      {done ? <Check className="size-4" strokeWidth={3} /> : n}
    </span>
  );
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
  const done = isAnswered(q, answer);
  return (
    <div
      data-q={q.id}
      data-done={done}
      className={cn("flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6", stateFrame(done))}
    >
      <p className="flex gap-3 text-[15px] leading-relaxed">
        <Num n={n} done={done} />
        <span>{q.text}</span>
      </p>
      <div className="shrink-0 pl-9 sm:pl-0">
        <TrueFalsePills options={q.options} name={q.id} answer={answer} disabled={disabled} onChange={onPick} />
      </div>
    </div>
  );
}

/* ── Appariement (dropdown) ── */
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
    <label
      data-q={q.id}
      data-done={!!value}
      className={cn(
        "flex gap-3 rounded-xl border p-3",
        stateFrame(!!value),
        value ? "border-emerald-200 bg-[var(--ex-soft)]" : "border-amber-200",
        numbered ? "items-center" : "flex-col"
      )}
    >
      {numbered ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {q.text.trim()}
        </span>
      ) : (
        <span className="text-[15px] font-semibold leading-snug">{q.text}</span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        className={cn(
          "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-[15px] transition-colors",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
          value ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        <option value="">Choisir…</option>
        {q.options.map((o) => (
          <option key={o.id} value={o.id}>
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
    <fieldset
      data-q={q.id}
      data-done={chosen.length > 0}
      className={cn(
        "rounded-xl border p-4",
        stateFrame(chosen.length > 0),
        chosen.length > 0 ? "border-emerald-200 bg-card" : "border-amber-200"
      )}
    >
      <legend className="sr-only">Question {n}</legend>
      <p className="mb-3 flex gap-2.5 text-[15px] font-semibold leading-snug">
        <Num n={n} done={chosen.length > 0} />
        <span>
          {q.text}
          {multi ? <span className="ml-1 text-xs font-medium text-muted-foreground">(plusieurs réponses possibles)</span> : null}
        </span>
      </p>
      <div className="space-y-1.5">
        {q.options.map((o, i) => {
          const on = chosen.includes(o.id);
          return (
            <label
              key={o.id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-[15px] transition-colors active:scale-[0.99]",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                on ? "border-primary bg-[var(--ex-soft)] font-semibold" : "border-transparent hover:bg-muted/60",
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
                  "flex size-6 shrink-0 items-center justify-center border-2 text-xs font-bold transition-colors",
                  multi ? "rounded-md" : "rounded-full",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {on && multi ? <Check className="size-3.5" strokeWidth={3} /> : LETTERS[i] ?? i + 1}
              </span>
              <span className="leading-snug">{o.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── Other types (texte à trous, association, tableau…) ── */
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
    <div data-q={q.id} data-done={done} className={cn("space-y-3 px-5 py-5", stateFrame(done))}>
      <p className="flex gap-3 text-[15px] font-semibold leading-relaxed">
        <Num n={n} done={done} />
        <span>{q.text}</span>
      </p>
      <div className="sm:pl-9">
        {q.interactive && q.type === "association" ? (
          <AssociationInput payload={q.interactive} value={text} disabled={disabled} onChange={onSetText} />
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
            className="h-11 max-w-md text-[15px]"
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

const KIND: Record<Layout, { icon: LucideIcon; label: string }> = {
  tf: { icon: ToggleRight, label: "Vrai ou Faux" },
  qcm: { icon: ListChecks, label: "Choix multiple" },
  match: { icon: Link2, label: "Associer" },
  block: { icon: PencilLine, label: "Répondre" },
};
function kindOf(questions: Question[]) {
  const q = questions[0];
  if (!q) return KIND.block;
  if (questions.every((x) => x.type === "table")) return { icon: Table2, label: "Tableau à cocher" };
  if (questions.every((x) => x.type === "association")) return { icon: Shuffle, label: "Relier" };
  const layouts = new Set(questions.map(layoutOf));
  return layouts.size === 1 ? KIND[layoutOf(q)] : { icon: ClipboardList, label: "Questions variées" };
}

const fmtPoints = (p: number) => `${Number.isInteger(p) ? p : p.toFixed(2).replace(/0$/, "")} pt${p > 1 ? "s" : ""}`;

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
  const done = section.questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const complete = done === section.questions.length;
  const groups = groupByLayout(section.questions);
  const kind = kindOf(section.questions);
  const KindIcon = kind.icon;

  return (
    <section
      id={`exercice-${index}`}
      style={{ ...themeVars(index - 1), "--i": index } as React.CSSProperties}
      className="anim-pop scroll-mt-32 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-12px_rgb(15_23_42/0.12)]"
    >
      <div className="flex items-center gap-4 border-b border-border bg-[var(--ex-soft)] px-5 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-xl font-bold text-primary-foreground">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Exercice {index}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
              <KindIcon className="size-3" strokeWidth={2.5} />
              {kind.label}
            </span>
          </div>
          <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">{sectionHeading(section.title)}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
            {fmtPoints(totalPoints)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              complete ? "text-emerald-600" : "text-amber-700"
            )}
          >
            {complete ? <CircleCheck className="size-3.5" /> : <CircleDashed className="size-3.5" />}
            {done}/{section.questions.length}
          </span>
        </div>
      </div>

      {section.imageUrl ? (
        <div className="border-b border-border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" className="mx-auto max-h-[480px] w-full rounded-lg object-contain" />
        </div>
      ) : null}

      {groups.map((g) => {
        if (g.layout === "tf") {
          return (
            <div key="tf" className="divide-y divide-border/70">
              {g.items.map(({ q, n }) => (
                <TfRow key={q.id} q={q} n={n} answer={answers[q.id]} disabled={disabled} onPick={(id) => onSetSingle(q.id, id)} />
              ))}
            </div>
          );
        }
        if (g.layout === "match") {
          return (
            <div key="match" className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {g.items.map(({ q }) => (
                <MatchBox key={q.id} q={q} answer={answers[q.id]} disabled={disabled} onPick={(id) => onSetSingle(q.id, id)} />
              ))}
            </div>
          );
        }
        if (g.layout === "qcm") {
          return (
            <div key="qcm" className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
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
          <div key="block" className="divide-y divide-border/70">
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

  // Scrolls to the next question still to answer (after the one in view)
  // and makes it pulse briefly so the eye lands on it.
  function goToNextUnanswered() {
    const todo = [...document.querySelectorAll<HTMLElement>('[data-q][data-done="false"]')];
    if (todo.length === 0) return;
    const viewTop = 140;
    const next = todo.find((el) => el.getBoundingClientRect().top > viewTop + 10) ?? todo[0];
    next.scrollIntoView({ behavior: "smooth", block: "center" });
    next.dataset.flash = "true";
    setTimeout(() => {
      next.dataset.flash = "false";
    }, 1600);
  }

  // The student confirms before handing in with unanswered questions (and
  // is taken to the first one if they go back); the timer hands in without
  // asking.
  function submitByStudent() {
    if (remaining > 0) {
      const ok = confirm(
        `Attention : il te reste ${remaining} question${remaining > 1 ? "s" : ""} sans réponse (en orange).\n\nOK = terminer quand même\nAnnuler = revenir aux questions oubliées`
      );
      if (!ok) {
        const first = document.querySelector<HTMLElement>('[data-q][data-done="false"]');
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (first) {
          first.dataset.flash = "true";
          setTimeout(() => {
            first.dataset.flash = "false";
          }, 1600);
        }
        return;
      }
    }
    submit();
  }

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.005_250)]">
      <ExamReloadWarning />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[oklch(0.27_0.06_260)] text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="min-w-0">
            <h1 className="truncate font-heading text-base font-semibold sm:text-xl">
              {examTitle}
              <span className="ml-2 hidden rounded-md bg-white/15 px-1.5 py-0.5 align-middle text-xs font-bold sm:inline">
                Modèle {modelLabel.toUpperCase()}
              </span>
            </h1>
            <p className="truncate text-xs text-white/70">
              {levelName ? `${levelName} · ` : ""}Informatique
              <span className="sm:hidden"> · Modèle {modelLabel.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {remaining > 0 ? (
              <button
                type="button"
                onClick={goToNextUnanswered}
                title="Aller à la prochaine question sans réponse"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-400 px-3 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:bg-amber-300"
              >
                <ArrowDownToLine className="size-4" />
                <span className="hidden md:inline">Question suivante</span>
                <span className="rounded-full bg-amber-950/15 px-1.5 text-xs tabular-nums">{remaining}</span>
              </button>
            ) : null}
            <ExamTimer deadline={deadline} onExpire={submit} />
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitByStudent}
              aria-label="Terminer l'examen"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-bold text-[oklch(0.27_0.06_260)] shadow-sm transition-colors hover:bg-white/90 disabled:opacity-60 sm:px-4"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span className="hidden sm:inline">Terminer</span>
            </button>
          </div>
        </div>

        {/* Exercise navigator: colour + progress per exercise */}
        <nav aria-label="Exercices" className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-2.5 sm:px-6 sm:pb-3">
          {sections.map((s, i) => {
            const done = s.questions.filter((q) => isAnswered(q, answers[q.id])).length;
            const complete = done === s.questions.length;
            return (
              <a
                key={s.id ?? "none"}
                href={`#exercice-${i + 1}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 transition-colors hover:bg-white/20"
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: colorOf(i).main }} />
                Ex {i + 1}
                <span className={cn("tabular-nums", complete ? "text-emerald-300" : "text-white/60")}>
                  {complete ? <Check className="inline size-3.5" strokeWidth={3} /> : `${done}/${s.questions.length}`}
                </span>
              </a>
            );
          })}
          <span className="ml-auto hidden shrink-0 items-center text-xs font-semibold text-white/70 sm:inline-flex">
            {answeredCount}/{allQuestions.length} réponses
          </span>
        </nav>
        <div className="h-1 w-full bg-white/10">
          <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-7 px-4 py-7 sm:px-6 sm:py-9">
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed text-sky-950">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-sky-600" />
          <div>
            <p className="font-heading text-base font-semibold">Bon courage !</p>
            <p>
              Lis bien chaque question. Les questions{" "}
              <span className="rounded bg-amber-200 px-1 font-semibold text-amber-950">en orange</span> attendent ta
              réponse, celles{" "}
              <span className="rounded bg-emerald-200 px-1 font-semibold text-emerald-950">en vert</span> sont faites.
              Le bouton <strong>Question suivante</strong> en haut t&apos;emmène à celle que tu as oubliée.
            </p>
          </div>
        </div>

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

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgb(0_0_0/0.04)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                  remaining === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700"
                )}
              >
                {remaining === 0 ? <PartyPopper className="size-5" /> : <ClipboardList className="size-5" />}
              </span>
              <div>
                <p className="font-heading text-lg font-semibold">
                  {remaining === 0 ? "Bravo, tout est répondu !" : `Encore ${remaining} question${remaining > 1 ? "s" : ""} à faire`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {remaining === 0
                    ? "Relis tes réponses, puis valide ton examen."
                    : "Elles sont encadrées en orange. Clique sur « Question suivante » pour les retrouver."}
                </p>
              </div>
            </div>
            {remaining > 0 ? (
              <button
                type="button"
                onClick={goToNextUnanswered}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-amber-400 bg-amber-50 px-5 text-base font-bold text-amber-900 transition-colors hover:bg-amber-100"
              >
                <ArrowDownToLine className="size-5" />
                Voir les questions oubliées
              </button>
            ) : null}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitByStudent}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-7 text-base font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              Valider l&apos;examen
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
