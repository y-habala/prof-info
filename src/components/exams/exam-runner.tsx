"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const selectClass =
  "h-9 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Q{index + 1}. {q.questionText}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {(q.questionType === "qcm_single" || q.questionType === "true_false") &&
          q.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={q.id}
                disabled={isSubmitting}
                checked={Array.isArray(answer) && answer[0] === o.id}
                onChange={() => onSetSingle(o.id)}
              />
              {o.text}
            </label>
          ))}
        {q.questionType === "qcm_multiple" &&
          q.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={isSubmitting}
                checked={Array.isArray(answer) && answer.includes(o.id)}
                onChange={() => onToggleMulti(o.id)}
              />
              {o.text}
            </label>
          ))}
        {q.questionType === "matching" && (
          <select
            disabled={isSubmitting}
            value={Array.isArray(answer) ? answer[0] ?? "" : ""}
            onChange={(e) => onSetSingle(e.target.value)}
            className={selectClass}
          >
            <option value="">…</option>
            {q.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.text}
              </option>
            ))}
          </select>
        )}
        {q.questionType === "fill_blank" && (
          <Input
            disabled={isSubmitting}
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onSetText(e.target.value)}
          />
        )}
        {q.questionType === "open" && (
          <Textarea
            rows={3}
            disabled={isSubmitting}
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onSetText(e.target.value)}
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
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-primary px-4 py-3 text-primary-foreground shadow-md sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{examTitle}</h1>
          {examDescription ? (
            <p className="truncate text-sm text-primary-foreground/80">{examDescription}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ExamTimer deadline={deadline} onExpire={handleSubmit} />
          <Button type="button" variant="secondary" size="sm" disabled={isSubmitting} onClick={handleSubmit}>
            Terminer
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {sections.map((section) => (
          <div key={section.id ?? "unsectioned"} className="space-y-4">
            {section.title ? (
              <div className="space-y-2 border-b pb-2">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL
                  <img src={section.imageUrl} alt="" className="max-h-80 w-full rounded-md object-contain" />
                ) : null}
              </div>
            ) : null}
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
        ))}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? "Envoi..." : "Valider l'examen"}
        </Button>
      </div>
    </>
  );
}
