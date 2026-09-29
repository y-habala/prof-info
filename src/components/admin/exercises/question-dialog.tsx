"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/admin/files/file-upload-field";
import {
  AVAILABLE_QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type QuestionFormValues,
} from "@/schemas/exercises";
import { createQuestion, updateQuestion } from "@/actions/exercise-questions";

type OptionDraft = { text: string; isCorrect: boolean };

type QuestionDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  exerciseId: string;
  nextOrderIndex?: number;
  initialValues?: {
    id: string;
    questionText: string;
    questionType: QuestionType;
    points: number;
    imageUrl: string | null;
    explanation: string | null;
    options: OptionDraft[];
  };
};

function initialOptionsFor(type: QuestionType, existing?: OptionDraft[]): OptionDraft[] {
  if (existing && existing.length > 0) return existing;
  if (type === "qcm_single" || type === "qcm_multiple") {
    return [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ];
  }
  return [];
}

export function QuestionDialog({
  trigger,
  mode,
  exerciseId,
  nextOrderIndex,
  initialValues,
}: QuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType | null>(
    mode === "edit" ? initialValues?.questionType ?? null : null
  );
  const [questionText, setQuestionText] = useState(initialValues?.questionText ?? "");
  const [points, setPoints] = useState(initialValues?.points ?? 1);
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [explanation, setExplanation] = useState(initialValues?.explanation ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    initialOptionsFor(initialValues?.questionType ?? "qcm_single", initialValues?.options)
  );
  const [correctText, setCorrectText] = useState(
    initialValues?.questionType === "fill_blank" ? initialValues?.options[0]?.text ?? "" : ""
  );
  const [trueFalseCorrect, setTrueFalseCorrect] = useState<"true" | "false">(
    initialValues?.questionType === "true_false" && initialValues.options[0]?.isCorrect === false
      ? "false"
      : "true"
  );

  function selectType(type: QuestionType) {
    setQuestionType(type);
    setOptions(initialOptionsFor(type));
  }

  // The dialog content stays mounted between opens (only visibility
  // toggles), so without this, a 2nd "+ Ajouter une question" in the same
  // page visit would start from the PREVIOUS question's field values
  // instead of blank ones.
  function resetForCreate() {
    setQuestionType(null);
    setQuestionText("");
    setPoints(1);
    setImageUrl("");
    setExplanation("");
    setOptions(initialOptionsFor("qcm_single"));
    setCorrectText("");
    setTrueFalseCorrect("true");
  }

  async function handleSubmit() {
    if (!questionType) return;
    setError(null);
    setIsPending(true);

    const values: QuestionFormValues = {
      questionText,
      questionType,
      points,
      imageUrl,
      explanation,
      options:
        // Placeholder only — optionsForType() in the action hardcodes the
        // actual "Vrai"/"Faux" text and ignores this; it just needs a
        // non-empty string to pass optionSchema's validation.
        questionType === "true_false"
          ? [{ text: "true_false", isCorrect: trueFalseCorrect === "true" }]
          : options,
      correctText,
    };

    const result =
      mode === "edit" && initialValues
        ? await updateQuestion(initialValues.id, exerciseId, values)
        : await createQuestion(exerciseId, nextOrderIndex ?? 0, values);

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          if (mode === "create") resetForCreate();
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Ajouter une question" : "Modifier la question"}
          </DialogTitle>
        </DialogHeader>

        {!questionType ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AVAILABLE_QUESTION_TYPES.map((type) => (
              <Button key={type} type="button" variant="outline" onClick={() => selectType(type)}>
                {QUESTION_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Image (optionnel)</Label>
              {imageUrl ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image */}
                  <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                    Retirer
                  </Button>
                </div>
              ) : (
                <FileUploadField
                  bucket="lesson-images"
                  accept="image/*"
                  onUploaded={(url) => setImageUrl(url)}
                />
              )}
            </div>

            {(questionType === "qcm_single" || questionType === "qcm_multiple") && (
              <div className="space-y-2">
                <Label>
                  Réponses ({questionType === "qcm_single" ? "une seule correcte" : "plusieurs correctes"})
                </Label>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={questionType === "qcm_single" ? "radio" : "checkbox"}
                      name="correct-option"
                      checked={option.isCorrect}
                      onChange={(e) => {
                        setOptions((prev) =>
                          prev.map((o, i) => {
                            if (questionType === "qcm_single") {
                              return { ...o, isCorrect: i === index };
                            }
                            return i === index ? { ...o, isCorrect: e.target.checked } : o;
                          })
                        );
                      }}
                      aria-label={`Réponse ${index + 1} correcte`}
                    />
                    <Input
                      value={option.text}
                      onChange={(e) =>
                        setOptions((prev) =>
                          prev.map((o, i) => (i === index ? { ...o, text: e.target.value } : o))
                        )
                      }
                      placeholder={`Réponse ${index + 1}`}
                      required
                    />
                    {options.length > 2 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                      >
                        ✕
                      </Button>
                    ) : null}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions((prev) => [...prev, { text: "", isCorrect: false }])}
                >
                  + Ajouter une réponse
                </Button>
              </div>
            )}

            {questionType === "true_false" && (
              <div className="space-y-2">
                <Label>Bonne réponse</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="true-false"
                      checked={trueFalseCorrect === "true"}
                      onChange={() => setTrueFalseCorrect("true")}
                    />
                    Vrai
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="true-false"
                      checked={trueFalseCorrect === "false"}
                      onChange={() => setTrueFalseCorrect("false")}
                    />
                    Faux
                  </label>
                </div>
              </div>
            )}

            {questionType === "fill_blank" && (
              <div className="space-y-2">
                <Label htmlFor="correctText">Réponse correcte</Label>
                <Input
                  id="correctText"
                  value={correctText}
                  onChange={(e) => setCorrectText(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="0"
                step="0.5"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explication (optionnel)</Label>
              <Textarea
                id="explanation"
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              {mode === "create" ? (
                <Button type="button" variant="ghost" onClick={() => setQuestionType(null)}>
                  ← Changer de type
                </Button>
              ) : null}
              <Button type="button" disabled={isPending} onClick={handleSubmit}>
                {isPending ? "Enregistrement..." : mode === "create" ? "Ajouter" : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
