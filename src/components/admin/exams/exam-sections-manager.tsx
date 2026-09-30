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
import { Button } from "@/components/ui/button";
import { ExamQuestionDialog } from "./exam-question-dialog";
import { MatchingSetDialog } from "./matching-set-dialog";
import { ExamSectionDialog } from "./exam-section-dialog";
import { ExamQuestionsList, type ExamQuestionRow } from "./exam-questions-list";
import { deleteExamSection, reorderExamSections } from "@/actions/exam-sections";

export type SectionWithQuestions = {
  id: string;
  title: string;
  image_url: string | null;
  questions: ExamQuestionRow[];
};

function AddButtons({
  examId,
  sectionId,
  nextOrderIndex,
}: {
  examId: string;
  sectionId: string | null;
  nextOrderIndex: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ExamQuestionDialog
        mode="create"
        examId={examId}
        nextOrderIndex={nextOrderIndex}
        sectionId={sectionId}
        trigger={
          <Button variant="outline" size="sm">
            + Ajouter une question
          </Button>
        }
      />
      <MatchingSetDialog
        examId={examId}
        nextOrderIndex={nextOrderIndex}
        sectionId={sectionId}
        trigger={
          <Button variant="outline" size="sm">
            + Ajouter un ensemble d&apos;appariement
          </Button>
        }
      />
    </div>
  );
}

function SortableSectionBlock({
  section,
  examId,
  allSections,
  isPending,
  onDelete,
}: {
  section: SectionWithQuestions;
  examId: string;
  allSections: { id: string; title: string }[];
  isPending: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="space-y-3 rounded-lg border p-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="Réordonner la section"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        {section.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided upload preview
          <img src={section.image_url} alt="" className="h-10 w-10 rounded object-cover" />
        ) : null}
        <h3 className="flex-1 font-semibold">{section.title}</h3>
        <ExamSectionDialog
          mode="edit"
          examId={examId}
          initialValues={{ id: section.id, title: section.title, imageUrl: section.image_url }}
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
      <ExamQuestionsList
        examId={examId}
        initialQuestions={section.questions}
        sections={allSections}
        currentSectionId={section.id}
      />
      <AddButtons examId={examId} sectionId={section.id} nextOrderIndex={section.questions.length} />
    </div>
  );
}

export function ExamSectionsManager({
  examId,
  initialSections,
  unsectionedQuestions,
}: {
  examId: string;
  initialSections: SectionWithQuestions[];
  unsectionedQuestions: ExamQuestionRow[];
}) {
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sections = orderOverride
    ? orderOverride
        .map((id) => initialSections.find((s) => s.id === id))
        .filter((s): s is SectionWithQuestions => s != null)
        .concat(initialSections.filter((s) => !orderOverride.includes(s.id)))
    : initialSections;

  const allSections = sections.map((s) => ({ id: s.id, title: s.title }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reorderedIds = arrayMove(
      sections.map((s) => s.id),
      oldIndex,
      newIndex
    );
    setOrderOverride(reorderedIds);
    startTransition(() => reorderExamSections(examId, reorderedIds));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sections</h2>
        <ExamSectionDialog
          mode="create"
          examId={examId}
          nextOrderIndex={sections.length}
          trigger={<Button size="sm">+ Nouvelle section</Button>}
        />
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune section pour le moment.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections.map((section) => (
                <SortableSectionBlock
                  key={section.id}
                  section={section}
                  examId={examId}
                  allSections={allSections}
                  isPending={isPending}
                  onDelete={() => {
                    if (confirm(`Supprimer la section "${section.title}" ? Les questions deviendront "sans section".`)) {
                      startTransition(() => deleteExamSection(section.id, examId));
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="space-y-3 rounded-lg border border-dashed p-4">
        <h3 className="font-semibold text-muted-foreground">Questions sans section</h3>
        <ExamQuestionsList
          examId={examId}
          initialQuestions={unsectionedQuestions}
          sections={allSections}
          currentSectionId={null}
        />
        <AddButtons examId={examId} sectionId={null} nextOrderIndex={unsectionedQuestions.length} />
      </div>
    </div>
  );
}
