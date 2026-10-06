"use client";
import { useTransition } from "react";
import {
  Type,
  Image as ImageIcon,
  Video,
  FileIcon,
  FileCheck2,
  Code2,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BlockDialog } from "./block-dialog";
import {
  deleteBlock,
  toggleBlockPublished,
  reorderBlocks,
} from "@/actions/lesson-blocks";
import { BLOCK_TYPE_LABELS, type BlockType } from "@/schemas/lesson-blocks";
import { cn } from "@/lib/utils";

export type BlockRow = {
  id: string;
  type: BlockType;
  title: string | null;
  content: Record<string, unknown>;
  order_index: number;
  is_published: boolean;
};

export type ExerciseOption = { id: string; title: string; level_id: string | null };

const ICON: Record<BlockType, LucideIcon> = {
  text: Type,
  image: ImageIcon,
  video: Video,
  file: FileIcon,
  exercise: FileCheck2,
  interactive: Code2,
};
const TINT: Record<BlockType, string> = {
  text: "bg-slate-50 text-slate-700",
  image: "bg-emerald-50 text-emerald-700",
  video: "bg-rose-50 text-rose-700",
  file: "bg-amber-50 text-amber-800",
  exercise: "bg-cyan-50 text-cyan-700",
  interactive: "bg-fuchsia-50 text-fuchsia-700",
};

export function SessionBlocksEditor({
  sessionId,
  blocks,
  exercises,
}: {
  sessionId: string;
  blocks: BlockRow[];
  exercises: ExerciseOption[];
}) {
  const [isPending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const next = blocks.slice();
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    startTransition(() => reorderBlocks(sessionId, next.map((b) => b.id)));
  }

  return (
    <div className="space-y-5">
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
          Pas encore de bloc. Clique sur un type ci-dessous pour commencer.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => {
            const Icon = ICON[block.type];
            return (
              <Card key={block.id} className={cn("p-4", !block.is_published && "opacity-70")}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TINT[block.type]}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="shrink-0">
                        {BLOCK_TYPE_LABELS[block.type]}
                      </Badge>
                      {block.title ? (
                        <p className="min-w-0 truncate font-semibold">{block.title}</p>
                      ) : null}
                    </div>
                    <BlockPreview block={block} exercises={exercises} />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending || i === 0}
                      onClick={() => move(i, -1)}
                      title="Monter"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending || i === blocks.length - 1}
                      onClick={() => move(i, 1)}
                      title="Descendre"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Switch
                      checked={block.is_published}
                      disabled={isPending}
                      onCheckedChange={(c) => startTransition(() => toggleBlockPublished(block.id, sessionId, c))}
                    />
                    {block.is_published ? (
                      <Eye className="size-3.5 text-success" />
                    ) : (
                      <EyeOff className="size-3.5 text-muted-foreground" />
                    )}
                    <BlockDialog
                      mode="edit"
                      sessionId={sessionId}
                      exercises={exercises}
                      initialBlock={block}
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
                        if (confirm("Supprimer ce bloc ?")) {
                          startTransition(() => deleteBlock(block.id, sessionId));
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ajouter un bloc
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((t) => {
            const Icon = ICON[t];
            return (
              <BlockDialog
                key={t}
                mode="create"
                initialType={t}
                sessionId={sessionId}
                exercises={exercises}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <div className={`flex size-6 items-center justify-center rounded-md ${TINT[t]}`}>
                      <Icon className="size-3.5" />
                    </div>
                    {BLOCK_TYPE_LABELS[t]}
                    <Plus className="size-3.5" />
                  </Button>
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block, exercises }: { block: BlockRow; exercises: ExerciseOption[] }) {
  switch (block.type) {
    case "text": {
      const md = String(block.content.markdown ?? "");
      return <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{md || "(vide)"}</p>;
    }
    case "image": {
      const url = String(block.content.url ?? "");
      const caption = String(block.content.caption ?? "");
      return (
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {caption || url || "(aucune URL)"}
        </p>
      );
    }
    case "video": {
      const yt = String(block.content.youtube_url ?? "");
      const v = String(block.content.video_url ?? "");
      return <p className="mt-1 truncate text-sm text-muted-foreground">{yt || v || "(aucune URL)"}</p>;
    }
    case "file": {
      const name = String(block.content.file_name ?? "");
      const url = String(block.content.url ?? "");
      return <p className="mt-1 truncate text-sm text-muted-foreground">{name || url || "(aucun fichier)"}</p>;
    }
    case "exercise": {
      const exId = String(block.content.exercise_id ?? "");
      const ex = exercises.find((e) => e.id === exId);
      return (
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {ex ? ex.title : <span className="text-destructive">Exercice introuvable</span>}
        </p>
      );
    }
    case "interactive": {
      const html = String(block.content.html ?? "");
      return (
        <p className="mt-1 truncate text-sm text-muted-foreground font-mono text-xs">
          {html ? `${html.slice(0, 80)}${html.length > 80 ? "…" : ""}` : "(aucun HTML)"}
        </p>
      );
    }
  }
}
