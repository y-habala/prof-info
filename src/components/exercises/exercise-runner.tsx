"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  imageUrl: string | null;
  options: { id: string; text: string }[];
};

type QuestionResult = {
  questionId: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  points: number;
  correctOptionTexts: string[];
};

type SubmitResult = {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionResults: QuestionResult[];
};

export function ExerciseRunner({
  exerciseId,
  questions,
}: {
  exerciseId: string;
  questions: Question[];
}) {
  const [step, setStep] = useState<"info" | "questions" | "results">("info");
  const [studentName, setStudentName] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

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
    setError(null);
    setIsSubmitting(true);

    const payload = {
      studentName,
      studentFirstName,
      studentClass,
      answers: questions.map((q) => {
        const a = answers[q.id];
        if (q.questionType === "fill_blank" || q.questionType === "open") {
          return { questionId: q.id, text: typeof a === "string" ? a : "" };
        }
        return { questionId: q.id, optionIds: Array.isArray(a) ? a : [] };
      }),
    };

    try {
      const res = await fetch(`/api/exercise/${exerciseId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Une erreur est survenue.");
        setIsSubmitting(false);
        return;
      }
      const data: SubmitResult = await res.json();
      setResult(data);
      setStep("results");
    } catch {
      setError("Une erreur est survenue.");
    }
    setIsSubmitting(false);
  }

  if (step === "info") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vos informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentFirstName">Prénom</Label>
            <Input
              id="studentFirstName"
              value={studentFirstName}
              onChange={(e) => setStudentFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentName">Nom</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentClass">Classe (optionnel)</Label>
            <Input
              id="studentClass"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
            />
          </div>
          <Button
            disabled={!studentName.trim() || !studentFirstName.trim()}
            onClick={() => setStep("questions")}
          >
            Commencer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Résultat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {result.score} / {result.maxScore}
            </p>
            <p className="text-muted-foreground">{result.percentage} %</p>
          </CardContent>
        </Card>
        {questions.map((q, i) => {
          const r = result.questionResults.find((res) => res.questionId === q.id);
          if (!r || r.isCorrect === null) return null;
          return (
            <Card key={q.id}>
              <CardContent className="space-y-1 pt-4">
                <p className="text-sm font-medium">
                  Q{i + 1}. {q.questionText}
                </p>
                <p className={r.isCorrect ? "text-sm text-green-600" : "text-sm text-destructive"}>
                  {r.isCorrect ? "Correct" : "Incorrect"} — {r.pointsEarned}/{r.points} pt
                </p>
                {!r.isCorrect && r.correctOptionTexts.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bonne réponse : {r.correctOptionTexts.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Q{i + 1}. {q.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided external/uploaded URL
              <img src={q.imageUrl} alt="" className="mb-2 max-h-48 rounded-md" />
            ) : null}
            {(q.questionType === "qcm_single" || q.questionType === "true_false") &&
              q.options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={q.id}
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
                    checked={Array.isArray(answers[q.id]) && answers[q.id]?.includes(o.id)}
                    onChange={() => toggleMultiAnswer(q.id, o.id)}
                  />
                  {o.text}
                </label>
              ))}
            {q.questionType === "fill_blank" && (
              <Input
                value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                onChange={(e) => setTextAnswer(q.id, e.target.value)}
              />
            )}
            {q.questionType === "open" && (
              <Textarea
                rows={3}
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
        {isSubmitting ? "Envoi..." : "Valider"}
      </Button>
    </div>
  );
}
