"use client";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { replaceExamOptions } from "@/actions/exams";
import { clozeAnswers } from "@/lib/exam-interactive";

// Word list for a "cloze" question. The right words live in the statement,
// between brackets; this list is what the student picks from (answers are
// added automatically when missing).
export function ClozeWordsEditor({
  questionId,
  questionText,
  modelId,
  examId,
  initial,
}: {
  questionId: string;
  questionText: string;
  modelId: string;
  examId: string;
  initial: string[];
}) {
  const [value, setValue] = useState(initial.join(" – "));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const answers = clozeAnswers(questionText);

  function save() {
    const words = value
      .split(/\s+[–-]\s+|[,;\n]/)
      .map((w) => w.trim())
      .filter(Boolean);
    startTransition(async () => {
      await replaceExamOptions(
        questionId,
        modelId,
        examId,
        words.map((text) => ({ text, isCorrect: false }))
      );
      setSaved(true);
    });
  }

  return (
    <div className="space-y-2 border-t border-border bg-muted/20 px-4 py-3 text-sm">
      {answers.length === 0 ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Aucun trou : dans l&apos;énoncé, mets chaque bonne réponse entre crochets, ex.{" "}
          <code>Une information est un ensemble de [données] qui possède un [sens].</code>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {answers.length} trou{answers.length > 1 ? "s" : ""} — réponses : <strong>{answers.join(" ; ")}</strong>
        </p>
      )}
      <label className="block text-xs font-medium" htmlFor={`words-${questionId}`}>
        Liste de mots proposés (séparés par « – » ou des virgules)
      </label>
      <div className="flex gap-2">
        <Input
          id={`words-${questionId}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="Information – Automatique – données – sens"
        />
        <Button size="sm" onClick={save} disabled={isPending} className="shrink-0 gap-1.5">
          {saved ? <Check className="size-3.5" /> : null}
          {saved ? "Enregistré" : "Enregistrer"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Laisse vide pour proposer seulement les bonnes réponses (mélangées). Les réponses absentes de la liste y sont
        ajoutées automatiquement.
      </p>
    </div>
  );
}
