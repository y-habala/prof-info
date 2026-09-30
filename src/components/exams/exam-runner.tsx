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

export function ExamRunner({
  attemptId,
  examTitle,
  examDescription,
  deadline,
  questions,
}: {
  attemptId: string;
  examTitle: string;
  examDescription: string | null;
  deadline: number;
  questions: Question[];
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
      answers: questions.map((q) => {
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            Terminer
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Q{i + 1}. {q.questionText}
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
                    checked={Array.isArray(answers[q.id]) && answers[q.id]?.[0] === o.id}
                    onChange={() => setSingleAnswer(q.id, o.id)}
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
                    checked={Array.isArray(answers[q.id]) && answers[q.id]?.includes(o.id)}
                    onChange={() => toggleMultiAnswer(q.id, o.id)}
                  />
                  {o.text}
                </label>
              ))}
            {q.questionType === "fill_blank" && (
              <Input
                disabled={isSubmitting}
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => setTextAnswer(q.id, e.target.value)}
              />
            )}
            {q.questionType === "open" && (
              <Textarea
                rows={3}
                disabled={isSubmitting}
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => setTextAnswer(q.id, e.target.value)}
              />
            )}
          </CardContent>
        </Card>
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
