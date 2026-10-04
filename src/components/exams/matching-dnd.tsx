"use client";

import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  questionText: string;
  points: number;
  options: { id: string; text: string }[];
};

function PoolChip({ optionId, text, disabled }: { optionId: string; text: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool:${optionId}`,
    disabled,
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      disabled={disabled}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "flex touch-none items-center gap-1.5 rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors select-none",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-grab hover:border-primary/60 active:cursor-grabbing",
        isDragging && "z-50 opacity-90 shadow-lg"
      )}
    >
      <GripVertical className="size-3.5 text-primary/50" />
      {text}
    </button>
  );
}

function DropTarget({
  questionId,
  assignedText,
  disabled,
  onClear,
}: {
  questionId: string;
  assignedText: string | null;
  disabled: boolean;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `target:${questionId}`, disabled });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-10 w-44 shrink-0 items-center justify-between gap-1.5 rounded-lg border-2 border-dashed px-2.5 text-sm transition-colors",
        assignedText
          ? "border-solid border-primary bg-primary/5 font-medium"
          : isOver
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 text-muted-foreground"
      )}
    >
      <span className="truncate">{assignedText ?? "Déposez ici…"}</span>
      {assignedText && !disabled ? (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Retirer la réponse"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

// A whole "matching set" (every pair sharing one identical option-text pool,
// per how src/actions/exam-questions.ts's createMatchingSet writes them)
// rendered as one drag-and-drop widget: a shared pool of draggable chips
// above, one drop target per pair below. Dropping a chip calls the exact
// same onAssign(questionId, optionId) the old <Select> used, so submit/
// grading needed zero changes — this only replaces the input widget.
export function MatchingGroup({
  questions,
  startIndex,
  answers,
  isSubmitting,
  onAssign,
  onClear,
}: {
  questions: Question[];
  startIndex: number;
  answers: Record<string, string[] | string>;
  isSubmitting: boolean;
  onAssign: (questionId: string, optionId: string) => void;
  onClear: (questionId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  // Keyed by this pool entry's own (always-unique) option id, not its text —
  // the admin's free-text pool input doesn't guarantee distinct lines, and a
  // duplicate option_text would otherwise collide as both a React key and a
  // dnd-kit draggable id. The match-by-text step below is still correct
  // regardless: it's how the data model (independent options per pair,
  // identical text across pairs) already works.
  const pool = (questions[0]?.options ?? []).map((o) => ({ optionId: o.id, text: o.text }));

  const assignedTextByQuestion = new Map<string, string>();
  for (const q of questions) {
    const answer = answers[q.id];
    const optionId = Array.isArray(answer) ? answer[0] : undefined;
    if (!optionId) continue;
    const text = q.options.find((o) => o.id === optionId)?.text;
    if (text) assignedTextByQuestion.set(q.id, text);
  }
  const usedTexts = new Set(assignedTextByQuestion.values());
  const availablePool = pool.filter((entry) => !usedTexts.has(entry.text));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const poolOptionId = String(active.id).slice("pool:".length);
    const draggedText = pool.find((entry) => entry.optionId === poolOptionId)?.text;
    if (!draggedText) return;
    const questionId = String(over.id).slice("target:".length);
    const option = questions.find((q) => q.id === questionId)?.options.find((o) => o.text === draggedText);
    if (option) onAssign(questionId, option.id);
  }

  return (
    <DndContext
      // A stable id (not dnd-kit's own render-order-derived default) so the
      // generated aria-describedby ids for screen readers agree between the
      // server-rendered HTML and the client hydration pass — the default
      // only matches when this is the Nth DndContext rendered in *both*
      // passes, which isn't guaranteed once more than one exists on a page.
      id={`matching-${questions[0]?.id ?? "group"}`}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-3">
        {availablePool.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 p-3">
            <span className="w-full text-xs font-medium text-muted-foreground">
              Glissez une réponse vers la paire correspondante :
            </span>
            {availablePool.map((entry) => (
              <PoolChip key={entry.optionId} optionId={entry.optionId} text={entry.text} disabled={isSubmitting} />
            ))}
          </div>
        ) : null}
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-center justify-between gap-3">
              <p className="flex-1 text-sm leading-snug font-medium">
                <span className="font-bold text-primary">{startIndex + i + 1}.</span> {q.questionText}
                <span className="ms-2 text-xs font-medium text-muted-foreground">
                  ({q.points} {q.points > 1 ? "pts" : "pt"})
                </span>
              </p>
              <DropTarget
                questionId={q.id}
                assignedText={assignedTextByQuestion.get(q.id) ?? null}
                disabled={isSubmitting}
                onClear={() => onClear(q.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
