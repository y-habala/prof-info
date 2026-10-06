"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Folder, Plus, Pencil, Trash2, ListOrdered, PlayCircle, Clock, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LevelDialog } from "./level-dialog";
import { UnitDialog } from "./unit-dialog";
import { SequenceDialog } from "./sequence-dialog";
import { SessionDialog } from "./session-dialog";
import {
  deleteLevel,
  toggleUnitPublished,
  deleteUnit,
  toggleSequencePublished,
  deleteSequence,
  toggleSessionPublished,
  deleteSession,
} from "@/actions/curriculum";
import { cn } from "@/lib/utils";

export type SessionRow = {
  id: string;
  title: string;
  duration_minutes: number | null;
  content_markdown: string;
  order_index: number;
  is_published: boolean;
};
export type SequenceRow = {
  id: string;
  title: string;
  order_index: number;
  is_published: boolean;
  sessions: SessionRow[];
};
export type UnitRow = {
  id: string;
  title: string;
  order_index: number;
  is_published: boolean;
  sequences: SequenceRow[];
};
export type LevelTreeRow = {
  id: string;
  name: string;
  units: UnitRow[];
};

export function CurriculumTree({ level }: { level: LevelTreeRow }) {
  return (
    <div className="space-y-4">
      <LevelHeader level={level} />
      {level.units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Aucune unité. Clique sur <strong>Nouvelle unité</strong> pour commencer.
        </div>
      ) : (
        <div className="space-y-3">
          {level.units.map((unit, i) => (
            <UnitAccordion key={unit.id} unit={unit} levelId={level.id} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function LevelHeader({ level }: { level: LevelTreeRow }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Folder className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Niveau</p>
          <p className="font-semibold">{level.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UnitDialog
          mode="create"
          levelId={level.id}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              Nouvelle unité
            </Button>
          }
        />
        <LevelDialog
          mode="edit"
          initialValues={{ id: level.id, name: level.name, orderIndex: 0 }}
          trigger={
            <Button size="sm" variant="outline" className="gap-1.5">
              <Pencil className="size-3.5" />
              Modifier
            </Button>
          }
        />
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            if (confirm(`Supprimer le niveau "${level.name}" et tout son contenu ?`)) {
              startTransition(() => deleteLevel(level.id));
            }
          }}
        >
          <Trash2 className="size-3.5" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function UnitAccordion({ unit, levelId, defaultOpen }: { unit: UnitRow; levelId: string; defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Folder className="size-5" />
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold">{unit.title}</span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={unit.is_published}
            disabled={isPending}
            onCheckedChange={(c) => startTransition(() => toggleUnitPublished(unit.id, levelId, c))}
          />
          <Badge variant={unit.is_published ? "success" : "secondary"}>
            {unit.is_published ? "Publié" : "Brouillon"}
          </Badge>
          <UnitDialog
            mode="edit"
            levelId={levelId}
            initialValues={{ id: unit.id, title: unit.title, orderIndex: unit.order_index }}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="size-3.5" />
                Modifier
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`Supprimer l'unité "${unit.title}" et tout son contenu ?`)) {
                startTransition(() => deleteUnit(unit.id, levelId));
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {isOpen ? (
        <div className="space-y-4 border-t border-border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Séquences
            </h4>
            <SequenceDialog
              mode="create"
              unitId={unit.id}
              levelId={levelId}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Nouvelle séquence
                </Button>
              }
            />
          </div>
          {unit.sequences.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune séquence.</p>
          ) : (
            <div className="space-y-3">
              {unit.sequences.map((seq) => (
                <SequenceBlock key={seq.id} sequence={seq} unitId={unit.id} levelId={levelId} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SequenceBlock({ sequence, unitId, levelId }: { sequence: SequenceRow; unitId: string; levelId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ListOrdered className="size-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{sequence.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={sequence.is_published}
            disabled={isPending}
            onCheckedChange={(c) => startTransition(() => toggleSequencePublished(sequence.id, levelId, c))}
          />
          <Badge variant={sequence.is_published ? "success" : "secondary"}>
            {sequence.is_published ? "Publié" : "Brouillon"}
          </Badge>
          <SequenceDialog
            mode="edit"
            unitId={unitId}
            levelId={levelId}
            initialValues={{ id: sequence.id, title: sequence.title, orderIndex: sequence.order_index }}
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
              if (confirm(`Supprimer la séquence "${sequence.title}" ?`)) {
                startTransition(() => deleteSequence(sequence.id, levelId));
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Séances</p>
          <SessionDialog
            mode="create"
            sequenceId={sequence.id}
            levelId={levelId}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="size-3.5" />
                Ajouter
              </Button>
            }
          />
        </div>
        {sequence.sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune séance.</p>
        ) : (
          <ul className="space-y-1.5">
            {sequence.sessions.map((s) => (
              <SessionRowItem key={s.id} session={s} sequenceId={sequence.id} levelId={levelId} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SessionRowItem({
  session,
  sequenceId,
  levelId,
}: {
  session: SessionRow;
  sequenceId: string;
  levelId: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-2 text-sm">
      <PlayCircle className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate font-medium">{session.title}</span>
      {session.duration_minutes ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {session.duration_minutes}&apos;
        </span>
      ) : null}
      <Switch
        checked={session.is_published}
        disabled={isPending}
        onCheckedChange={(c) => startTransition(() => toggleSessionPublished(session.id, levelId, c))}
      />
      <Link
        href={`/admin/curriculum/sessions/${session.id}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        <FileEdit className="size-3.5" />
        Contenu
      </Link>
      <SessionDialog
        mode="edit"
        sequenceId={sequenceId}
        levelId={levelId}
        initialValues={{
          id: session.id,
          title: session.title,
          durationMinutes: session.duration_minutes,
          orderIndex: session.order_index,
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
          if (confirm(`Supprimer la séance "${session.title}" ?`)) {
            startTransition(() => deleteSession(session.id, levelId));
          }
        }}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

