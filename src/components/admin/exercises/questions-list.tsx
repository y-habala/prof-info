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
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/schemas/exercises";
import { QuestionDialog } from "./question-dialog";
import { deleteQuestion, reorderQuestions } from "@/actions/exercise-questions";

export type QuestionRow = {
  id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  image_url: string | null;
  explanation: string | null;
  exercise_options: { text: string; isCorrect: boolean }[];
};

function SortableQuestionRow({
  question,
  index,
  exerciseId,
  isPending,
  onDelete,
}: {
  question: QuestionRow;
  index: number;
  exerciseId: string;
  isPending: boolean;
  onDelete: () => void;
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
          <Badge variant="secondary">{QUESTION_TYPE_LABELS[question.question_type]}</Badge>
          <span className="text-xs text-muted-foreground">{question.points} pt</span>
        </div>
        <p className="text-sm font-medium">{question.question_text}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <QuestionDialog
          mode="edit"
          exerciseId={exerciseId}
          initialValues={{
            id: question.id,
            questionText: question.question_text,
            questionType: question.question_type,
            points: question.points,
            imageUrl: question.image_url,
            explanation: question.explanation,
            options: question.exercise_options,
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

export function QuestionsList({
  exerciseId,
  initialQuestions,
}: {
  exerciseId: string;
  initialQuestions: QuestionRow[];
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
        .filter((q): q is QuestionRow => q != null)
        .concat(initialQuestions.filter((q) => !orderOverride.includes(q.id)))
    : initialQuestions;

  if (questions.length === 0) {
    return <p className="text-muted-foreground">Aucune question pour cet exercice.</p>;
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
    startTransition(() => reorderQuestions(exerciseId, reorderedIds));
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
              exerciseId={exerciseId}
              isPending={isPending}
              onDelete={() => {
                if (confirm("Supprimer cette question ?")) {
                  startTransition(() => deleteQuestion(question.id, exerciseId));
                }
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
