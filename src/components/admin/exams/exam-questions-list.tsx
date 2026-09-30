"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXAM_QUESTION_TYPE_LABELS, type ExamQuestionType } from "@/schemas/exams";
import { ExamQuestionDialog } from "./exam-question-dialog";
import {
  deleteExamQuestion,
  reorderExamQuestions,
  moveExamQuestionToSection,
} from "@/actions/exam-questions";

export type ExamQuestionRow = {
  id: string;
  question_text: string;
  question_type: ExamQuestionType;
  points: number;
  exam_options: { text: string; isCorrect: boolean }[];
};

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function SortableQuestionRow({
  question,
  index,
  examId,
  sections,
  currentSectionId,
  isPending,
  onDelete,
  onMove,
}: {
  question: ExamQuestionRow;
  index: number;
  examId: string;
  sections: { id: string; title: string }[];
  currentSectionId: string | null;
  isPending: boolean;
  onDelete: () => void;
  onMove: (sectionId: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-start gap-3 rounded-lg border bg-background p-3"
    >
      <button
        type="button"
        className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Q{index + 1}</span>
          <Badge variant="secondary">{EXAM_QUESTION_TYPE_LABELS[question.question_type]}</Badge>
          <span className="text-xs text-muted-foreground">{question.points} pt</span>
        </div>
        <p className="text-sm font-medium">{question.question_text}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {sections.length > 0 ? (
          <select
            value={currentSectionId ?? ""}
            onChange={(e) => onMove(e.target.value || null)}
            className={selectClass}
            aria-label="Déplacer vers une autre section"
          >
            <option value="">Sans section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        ) : null}
        <ExamQuestionDialog
          mode="edit"
          examId={examId}
          initialValues={{
            id: question.id,
            questionText: question.question_text,
            questionType: question.question_type,
            points: question.points,
            options: question.exam_options,
          }}
          trigger={
            <Button variant="outline" size="sm">
              Modifier
            </Button>
          }
        />
        <Button variant="destructive" size="sm" disabled={isPending} onClick={onDelete}>
          Supprimer
        </Button>
      </div>
    </div>
  );
}

export function ExamQuestionsList({
  examId,
  initialQuestions,
  sections = [],
  currentSectionId = null,
}: {
  examId: string;
  initialQuestions: ExamQuestionRow[];
  sections?: { id: string; title: string }[];
  currentSectionId?: string | null;
}) {
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const questions = orderOverride
    ? orderOverride
        .map((id) => initialQuestions.find((q) => q.id === id))
        .filter((q): q is ExamQuestionRow => q != null)
        .concat(initialQuestions.filter((q) => !orderOverride.includes(q.id)))
    : initialQuestions;

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune question pour le moment.</p>;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const reorderedIds = arrayMove(
      questions.map((q) => q.id),
      oldIndex,
      newIndex
    );
    setOrderOverride(reorderedIds);
    startTransition(() => reorderExamQuestions(examId, reorderedIds));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <SortableQuestionRow
              key={question.id}
              question={question}
              index={index}
              examId={examId}
              sections={sections}
              currentSectionId={currentSectionId}
              isPending={isPending}
              onDelete={() => {
                if (confirm("Supprimer cette question ?")) {
                  startTransition(() => deleteExamQuestion(question.id, examId));
                }
              }}
              onMove={(sectionId) =>
                startTransition(() => moveExamQuestionToSection(question.id, examId, sectionId))
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
