"use client";
import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Trash2, Copy, FileText, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExamModelDialog } from "./exam-model-dialog";
import { DuplicateModelDialog } from "./duplicate-model-dialog";
import { deleteExamModel } from "@/actions/exams";

type Model = {
  id: string;
  label: string;
  secret_code: string;
  sections_count: number;
  questions_count: number;
};

// Pastel accents per letter — so admin eyes can tell models apart quickly.
function accentFor(label: string): { bg: string; text: string } {
  const palette = [
    { bg: "bg-blue-50", text: "text-blue-700" },
    { bg: "bg-emerald-50", text: "text-emerald-700" },
    { bg: "bg-amber-50", text: "text-amber-800" },
    { bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
    { bg: "bg-cyan-50", text: "text-cyan-700" },
    { bg: "bg-rose-50", text: "text-rose-700" },
  ];
  const c = (label.charCodeAt(0) - 65) % palette.length;
  return palette[c < 0 ? 0 : c];
}

export function ExamModelCard({
  examId,
  model,
  existingLabels,
}: {
  examId: string;
  model: Model;
  existingLabels: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const accent = accentFor(model.label.toUpperCase());

  return (
    <Card className="relative overflow-hidden p-5">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full ${accent.bg}`} />

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${accent.bg}`}>
            <span className={`font-mono text-2xl font-bold uppercase ${accent.text}`}>{model.label}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Code</p>
            <p className="font-mono text-xl font-bold tracking-widest">{model.secret_code}</p>
          </div>
        </div>

        <div className="flex gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" />
            {model.sections_count} section{model.sections_count > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5" />
            {model.questions_count} question{model.questions_count > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/exams/${examId}/models/${model.id}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Modifier
            <ArrowRight className="size-3.5" />
          </Link>
          <ExamModelDialog
            examId={examId}
            mode="edit"
            initialValues={{ id: model.id, label: model.label, secretCode: model.secret_code }}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <DuplicateModelDialog
            examId={examId}
            modelId={model.id}
            modelLabel={model.label}
            existingLabels={existingLabels}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5" title="Dupliquer ce modèle (ex. A → B)">
                <Copy className="size-3.5" />
                Dupliquer
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`Supprimer le modèle ${model.label} et toutes ses questions ?`)) {
                startTransition(() => deleteExamModel(model.id, examId));
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
