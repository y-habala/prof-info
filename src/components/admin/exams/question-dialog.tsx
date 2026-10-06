"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createExamQuestion, updateExamQuestion } from "@/actions/exams";
import { EXAM_QUESTION_TYPES, EXAM_QUESTION_TYPE_LABELS, type ExamQuestionType } from "@/schemas/exams";

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  mode: "create" | "edit";
  modelId: string;
  examId: string;
  sectionId: string | null;
  initialValues?: {
    id: string;
    text: string;
    type: ExamQuestionType;
    points: number;
  };
};

export function QuestionDialog({ trigger, mode, modelId, examId, sectionId, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result =
      mode === "edit" && initialValues
        ? await updateExamQuestion(initialValues.id, modelId, examId, undefined, formData)
        : await createExamQuestion(modelId, sectionId, examId, undefined, formData);
    setIsPending(false);
    if (result?.error) setError(result.error);
    else setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setFormKey((k) => k + 1);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle question" : "Modifier la question"}</DialogTitle>
        </DialogHeader>
        <form key={formKey} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Énoncé</Label>
            <Textarea id="questionText" name="questionText" rows={3} defaultValue={initialValues?.text ?? ""} required />
          </div>
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div className="space-y-2">
              <Label htmlFor="questionType">Type</Label>
              <Select id="questionType" name="questionType" defaultValue={initialValues?.type ?? "qcm_single"}>
                {EXAM_QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EXAM_QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input id="points" name="points" type="number" step="0.5" min="0.5" defaultValue={initialValues?.points ?? 1} required />
            </div>
          </div>
          {mode === "create" ? (
            <p className="text-xs text-muted-foreground">
              Les réponses se définissent après création, directement sous la question.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="w-full gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
