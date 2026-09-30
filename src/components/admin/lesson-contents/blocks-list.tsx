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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BLOCK_TYPE_LABELS, type BlockType } from "@/schemas/lesson-contents";
import type { BlockContentValues } from "./block-form-fields";
import { BlockDialog } from "./block-dialog";
import {
  toggleLessonContentPublished,
  deleteLessonContent,
  reorderLessonContents,
} from "@/actions/lesson-contents";

export type BlockRow = {
  id: string;
  type: BlockType;
  title: string | null;
  content: BlockContentValues;
  order_index: number;
  is_published: boolean;
};

function blockPreview(block: BlockRow, htmlPages: { id: string; title: string }[]): string {
  switch (block.type) {
    case "text":
      return block.content.text?.slice(0, 80) ?? "";
    case "image":
      return block.content.url ?? "";
    case "video":
      return block.content.youtube_url || block.content.video_url || "";
    case "pdf":
    case "file":
      return block.content.file_name ?? "";
    case "exercise":
      return "";
    case "html":
      return htmlPages.find((p) => p.id === block.content.html_page_id)?.title ?? "";
  }
}

function SortableBlockRow({
  block,
  sessionId,
  exercises,
  htmlPages,
  isPending,
  onToggle,
  onDelete,
}: {
  block: BlockRow;
  sessionId: string;
  exercises: { id: string; title: string }[];
  htmlPages: { id: string; title: string }[];
  isPending: boolean;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-lg border bg-background p-3"
      data-dragging={isDragging || undefined}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Badge variant="secondary">{BLOCK_TYPE_LABELS[block.type]}</Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{block.title || "(sans titre)"}</p>
        <p className="truncate text-xs text-muted-foreground">{blockPreview(block, htmlPages)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={block.is_published} disabled={isPending} onCheckedChange={onToggle} />
        <Badge variant={block.is_published ? "default" : "secondary"}>
          {block.is_published ? "Publié" : "Brouillon"}
        </Badge>
      </div>
      <BlockDialog
        mode="edit"
        sessionId={sessionId}
        exercises={exercises}
        htmlPages={htmlPages}
        initialValues={{
          id: block.id,
          type: block.type,
          title: block.title,
          content: block.content,
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
  );
}

export function BlocksList({
  sessionId,
  initialBlocks,
  exercises = [],
  htmlPages = [],
}: {
  sessionId: string;
  initialBlocks: BlockRow[];
  exercises?: { id: string; title: string }[];
  htmlPages?: { id: string; title: string }[];
}) {
  // initialBlocks (from the Server Component, refreshed by revalidatePath
  // after every mutation) is the source of truth — no permanent local copy.
  // orderOverride exists only to show the result instantly during/right
  // after a drag, before the server round-trip's revalidation lands; once
  // fresh props arrive with a different reference, it's simply not used
  // (a stale override id list would just filter out missing rows, see below).
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const blocks = orderOverride
    ? (orderOverride
        .map((id) => initialBlocks.find((b) => b.id === id))
        .filter((b): b is BlockRow => b != null)
        // in case a block was added/removed since the override was captured
        .concat(initialBlocks.filter((b) => !orderOverride.includes(b.id))))
    : initialBlocks;

  if (blocks.length === 0) {
    return <p className="text-muted-foreground">Aucun contenu pour cette séance.</p>;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reorderedIds = arrayMove(
      blocks.map((b) => b.id),
      oldIndex,
      newIndex
    );
    setOrderOverride(reorderedIds);
    startTransition(() => reorderLessonContents(sessionId, reorderedIds));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.map((block) => (
            <SortableBlockRow
              key={block.id}
              block={block}
              sessionId={sessionId}
              exercises={exercises}
              htmlPages={htmlPages}
              isPending={isPending}
              onToggle={(checked) =>
                startTransition(() => toggleLessonContentPublished(block.id, sessionId, checked))
              }
              onDelete={() => {
                if (confirm("Supprimer ce bloc ?")) {
                  startTransition(() => deleteLessonContent(block.id, sessionId));
                }
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
