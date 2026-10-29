"use client";
import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ChevronDown, FolderOpen, FileText, Check, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionDialog } from "./section-dialog";
import { QuestionDialog } from "./question-dialog";
import {
  deleteExamSection,
  deleteExamQuestion,
  replaceExamOptions,
  reorderExamSections,
  reorderExamQuestions,
} from "@/actions/exams";
import { EXAM_QUESTION_TYPE_LABELS, type ExamQuestionType } from "@/schemas/exams";
import { cn } from "@/lib/utils";
import { isInteractive } from "@/lib/exam-interactive";
import { InteractiveOptionsEditor } from "./interactive-options-editor";
import { TableOptionsEditor } from "./table-options-editor";

export type OptionData = { id: string; text: string; isCorrect: boolean };
export type QuestionData = {
  id: string;
  text: string;
  type: ExamQuestionType;
  points: number;
  options: OptionData[];
};
export type SectionData = {
  id: string;
  title: string;
  imageUrl: string | null;
  orderIndex: number;
  questions: QuestionData[];
};
export type ModelData = {
  examId: string;
  modelId: string;
  examTitle: string;
  modelLabel: string;
  secretCode: string;
  sections: SectionData[];
  unsectionedQuestions: QuestionData[];
};

function swapped<T>(list: T[], i: number, j: number) {
  const next = list.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// Up/down arrows: the list reorders right away; the server catches up.
function MoveButtons({
  first,
  last,
  disabled,
  onMove,
  label,
}: {
  first: boolean;
  last: boolean;
  disabled: boolean;
  onMove: (dir: -1 | 1) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="outline" disabled={disabled || first} onClick={() => onMove(-1)} title={`Monter ${label}`}>
        <ArrowUp className="size-3.5" />
      </Button>
      <Button size="sm" variant="outline" disabled={disabled || last} onClick={() => onMove(1)} title={`Descendre ${label}`}>
        <ArrowDown className="size-3.5" />
      </Button>
    </div>
  );
}

export function ModelBuilder({ data }: { data: ModelData }) {
  const [sections, setSections] = useState(data.sections);
  const [synced, setSynced] = useState(data.sections);
  const [isPending, startTransition] = useTransition();
  // Server data changed (add / edit / delete): take it over.
  if (synced !== data.sections) {
    setSynced(data.sections);
    setSections(data.sections);
  }

  function moveSection(i: number, dir: -1 | 1) {
    const next = swapped(sections, i, i + dir);
    setSections(next);
    startTransition(async () => {
      await reorderExamSections(data.modelId, data.examId, next.map((s) => s.id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Sections */}
      {sections.map((section, i) => (
        <SectionBlock
          key={section.id}
          section={section}
          defaultOpen={i === 0}
          examId={data.examId}
          modelId={data.modelId}
          move={
            <MoveButtons
              first={i === 0}
              last={i === sections.length - 1}
              disabled={isPending}
              onMove={(dir) => moveSection(i, dir)}
              label="la section"
            />
          }
        />
      ))}

      {/* Questions outside any section */}
      {data.unsectionedQuestions.length > 0 ? (
        <UnsectionedQuestionsBlock
          examId={data.examId}
          modelId={data.modelId}
          questions={data.unsectionedQuestions}
        />
      ) : null}

      {/* Add actions at the bottom */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <SectionDialog
          mode="create"
          modelId={data.modelId}
          examId={data.examId}
          trigger={
            <Button variant="outline" className="gap-2">
              <Plus className="size-4" />
              Nouvelle section
            </Button>
          }
        />
        <QuestionDialog
          mode="create"
          modelId={data.modelId}
          examId={data.examId}
          sectionId={null}
          trigger={
            <Button variant="outline" className="gap-2">
              <Plus className="size-4" />
              Question sans section
            </Button>
          }
        />
        <p className="text-xs text-muted-foreground">
          Les sections permettent de regrouper des questions sous un même titre (ex. &quot;Exercice 1&quot;).
        </p>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  defaultOpen,
  examId,
  modelId,
  move,
}: {
  section: SectionData;
  defaultOpen: boolean;
  examId: string;
  modelId: string;
  move: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(defaultOpen);
  const totalPoints = section.questions.reduce((s, q) => s + Number(q.points), 0);

  return (
    <Card className="overflow-hidden border-t-4 border-t-primary p-0">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 bg-muted/30 px-5 py-3", open && "border-b border-border")}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <FolderOpen className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="truncate font-bold">{section.title}</h2>
            <p className="text-xs text-muted-foreground">
              {section.questions.length} question{section.questions.length > 1 ? "s" : ""} ·{" "}
              {totalPoints} point{totalPoints > 1 ? "s" : ""}
            </p>
          </div>
          <ChevronDown className={cn("ml-auto size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        <div className="flex items-center gap-2">
          {move}
          <QuestionDialog
            mode="create"
            modelId={modelId}
            examId={examId}
            sectionId={section.id}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="size-3.5" />
                Question
              </Button>
            }
          />
          <SectionDialog
            mode="edit"
            modelId={modelId}
            examId={examId}
            initialValues={{ id: section.id, title: section.title, imageUrl: section.imageUrl }}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`Supprimer la section "${section.title}" et toutes ses questions ?`)) {
                startTransition(() => deleteExamSection(section.id, modelId, examId));
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {open ? (
        <>
          {section.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={section.imageUrl} alt="" className="max-h-80 w-full object-contain border-b border-border p-3" />
          ) : null}
          {section.questions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Aucune question. Clique sur <strong>+ Question</strong>.</p>
          ) : (
            <QuestionList questions={section.questions} modelId={modelId} examId={examId} />
          )}
        </>
      ) : null}
    </Card>
  );
}

function UnsectionedQuestionsBlock({
  examId,
  modelId,
  questions,
}: {
  examId: string;
  modelId: string;
  questions: QuestionData[];
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-muted-foreground" />
          <h2 className="font-bold">Questions sans section</h2>
        </div>
      </div>
      <QuestionList questions={questions} modelId={modelId} examId={examId} />
    </Card>
  );
}

function QuestionList({ questions, modelId, examId }: { questions: QuestionData[]; modelId: string; examId: string }) {
  const [list, setList] = useState(questions);
  const [synced, setSynced] = useState(questions);
  const [isPending, startTransition] = useTransition();
  if (synced !== questions) {
    setSynced(questions);
    setList(questions);
  }

  function move(i: number, dir: -1 | 1) {
    const next = swapped(list, i, i + dir);
    setList(next);
    startTransition(async () => {
      await reorderExamQuestions(modelId, examId, next.map((q) => q.id));
    });
  }

  return (
    <div className="divide-y divide-border">
      {list.map((q, i) => (
        <QuestionItem
          key={q.id}
          question={q}
          index={i + 1}
          modelId={modelId}
          examId={examId}
          move={
            <MoveButtons
              first={i === 0}
              last={i === list.length - 1}
              disabled={isPending}
              onMove={(dir) => move(i, dir)}
              label="la question"
            />
          }
        />
      ))}
    </div>
  );
}

function QuestionItem({
  question,
  index,
  modelId,
  examId,
  move,
}: {
  question: QuestionData;
  index: number;
  modelId: string;
  examId: string;
  move: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            Q{index}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{question.text}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{EXAM_QUESTION_TYPE_LABELS[question.type]}</Badge>
              <Badge variant="outline">
                {question.points} {Number(question.points) > 1 ? "pts" : "pt"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {move}
          <QuestionDialog
            mode="edit"
            modelId={modelId}
            examId={examId}
            sectionId={null}
            initialValues={{
              id: question.id,
              text: question.text,
              type: question.type,
              points: question.points,
            }}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`Supprimer cette question ?`)) {
                startTransition(() => deleteExamQuestion(question.id, modelId, examId));
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {question.type === "table" || question.type === "boxes" ? (
        <TableOptionsEditor
          mode={question.type}
          questionId={question.id}
          modelId={modelId}
          examId={examId}
          initial={question.options.map((o) => o.text)}
        />
      ) : isInteractive(question.type) ? (
        <InteractiveOptionsEditor
          type={question.type}
          questionId={question.id}
          modelId={modelId}
          examId={examId}
          initial={question.options.map((o) => o.text)}
        />
      ) : (
        <OptionsEditor question={question} modelId={modelId} examId={examId} />
      )}
    </div>
  );
}

function OptionsEditor({ question, modelId, examId }: { question: QuestionData; modelId: string; examId: string }) {
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    question.options.length > 0
      ? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : question.type === "true_false"
        ? [
            { text: "Vrai", isCorrect: false },
            { text: "Faux", isCorrect: false },
          ]
        : question.type === "fill_blank"
          ? [{ text: "", isCorrect: true }]
          : [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ]
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isSingle = question.type === "qcm_single" || question.type === "true_false" || question.type === "matching";
  const isFill = question.type === "fill_blank";

  function updateText(i: number, text: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text } : o)));
    setSaved(false);
  }
  function toggleCorrect(i: number) {
    setOptions((prev) =>
      prev.map((o, idx) =>
        isSingle ? { ...o, isCorrect: idx === i } : idx === i ? { ...o, isCorrect: !o.isCorrect } : o
      )
    );
    setSaved(false);
  }
  function addOption() {
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
    setSaved(false);
  }
  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }
  function save() {
    startTransition(async () => {
      await replaceExamOptions(question.id, modelId, examId, options);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isFill ? "Réponse(s) correcte(s)" : isSingle ? "Choix (une seule bonne réponse)" : "Choix (plusieurs bonnes réponses possibles)"}
      </p>
      <div className="space-y-1.5">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCorrect(i)}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                isSingle ? "rounded-full" : "",
                o.isCorrect
                  ? "border-success bg-success text-success-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-foreground/40"
              )}
              title={o.isCorrect ? "Bonne réponse" : "Marquer comme bonne réponse"}
            >
              {o.isCorrect ? <Check className="size-4" strokeWidth={3} /> : null}
            </button>
            <Input
              value={o.text}
              onChange={(e) => updateText(i, e.target.value)}
              placeholder={isFill ? "Réponse acceptée" : `Option ${String.fromCharCode(97 + i)}`}
              className="h-8"
            />
            {!isFill && options.length > 2 ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeOption(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        {!isFill || options.length < 1 ? (
          <Button size="sm" variant="outline" onClick={addOption} className="gap-1.5">
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={addOption} className="gap-1.5">
            <Plus className="size-3.5" />
            Ajouter une variante
          </Button>
        )}
        <div className="flex items-center gap-2">
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <Check className="size-3.5" />
              Enregistré
            </span>
          ) : null}
          <Button size="sm" disabled={isPending} onClick={save}>
            Enregistrer les réponses
          </Button>
        </div>
      </div>
    </div>
  );
}
