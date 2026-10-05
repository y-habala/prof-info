"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UnitDialog } from "./unit-dialog";
import { SequenceDialog } from "@/components/admin/sequences/sequence-dialog";
import { SessionDialog } from "@/components/admin/sessions/session-dialog";
import { SessionsTable, type SessionRow } from "@/components/admin/sessions/sessions-table";
import { toggleUnitPublished, deleteUnit } from "@/actions/units";
import { toggleSequencePublished, deleteSequence } from "@/actions/sequences";

export type SequenceTreeRow = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  sessions: SessionRow[];
};

export type UnitTreeRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  order_index: number;
  is_published: boolean;
  sequences: SequenceTreeRow[];
};

function SequenceSection({
  sequence,
  unitId,
  levelId,
}: {
  sequence: SequenceTreeRow;
  unitId: string;
  levelId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{sequence.title}</p>
          {sequence.description ? (
            <p className="text-sm text-muted-foreground">{sequence.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={sequence.is_published}
            disabled={isPending}
            onCheckedChange={(checked) =>
              startTransition(() => toggleSequencePublished(sequence.id, unitId, levelId, checked))
            }
          />
          <Badge variant={sequence.is_published ? "default" : "secondary"}>
            {sequence.is_published ? "Publié" : "Brouillon"}
          </Badge>
          <SequenceDialog
            mode="edit"
            unitId={unitId}
            unitLevelId={levelId}
            initialValues={{
              id: sequence.id,
              title: sequence.title,
              description: sequence.description,
              orderIndex: sequence.order_index,
            }}
            trigger={
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            }
          />
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (confirm(`Supprimer la séquence "${sequence.title}" et toutes ses séances ?`)) {
                startTransition(() => deleteSequence(sequence.id, unitId, levelId));
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Séances
          </h4>
          <SessionDialog
            mode="create"
            sequenceId={sequence.id}
            unitId={unitId}
            levelId={levelId}
            trigger={<Button size="sm">+ Nouvelle séance</Button>}
          />
        </div>
        <SessionsTable
          sessions={sequence.sessions}
          sequenceId={sequence.id}
          unitId={unitId}
          levelId={levelId}
        />
      </div>
    </div>
  );
}

function UnitAccordion({
  unit,
  levelId,
  defaultOpen,
}: {
  unit: UnitTreeRow;
  levelId: string;
  defaultOpen: boolean;
}) {
  // Local toggle state, set once from `defaultOpen` at mount — NOT re-derived
  // from a prop every render. A revalidatePath refetch anywhere in the tree
  // re-passes `units` into this already-mounted component (matched by the
  // stable `key={unit.id}` below), and this must survive that untouched, or
  // every mutation would snap every accordion but the first shut again.
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Folder className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{unit.title}</span>
            {unit.description ? (
              <span className="block truncate text-sm text-muted-foreground">
                {unit.description}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={unit.is_published}
            disabled={isPending}
            onCheckedChange={(checked) =>
              startTransition(() => toggleUnitPublished(unit.id, levelId, checked))
            }
          />
          <Badge variant={unit.is_published ? "default" : "secondary"}>
            {unit.is_published ? "Publié" : "Brouillon"}
          </Badge>
          <UnitDialog
            mode="edit"
            levelId={levelId}
            initialValues={{
              id: unit.id,
              title: unit.title,
              description: unit.description,
              imageUrl: unit.image_url,
              orderIndex: unit.order_index,
            }}
            trigger={
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            }
          />
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (
                confirm(`Supprimer l'unité "${unit.title}" et tout son contenu (séquences, séances) ?`)
              ) {
                startTransition(() => deleteUnit(unit.id, levelId));
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>
      {isOpen ? (
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Séquences
            </h3>
            <SequenceDialog
              mode="create"
              unitId={unit.id}
              unitLevelId={levelId}
              trigger={<Button size="sm">+ Nouvelle séquence</Button>}
            />
          </div>
          {unit.sequences.length > 0 ? (
            <div className="space-y-3">
              {unit.sequences.map((sequence) => (
                <SequenceSection
                  key={sequence.id}
                  sequence={sequence}
                  unitId={unit.id}
                  levelId={levelId}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune séquence pour cette unité.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function CurriculumTree({ units, levelId }: { units: UnitTreeRow[]; levelId: string }) {
  if (units.length === 0) {
    return <p className="text-muted-foreground">Aucune unité pour ce niveau.</p>;
  }

  return (
    <div className="space-y-4">
      {units.map((unit, index) => (
        <UnitAccordion key={unit.id} unit={unit} levelId={levelId} defaultOpen={index === 0} />
      ))}
    </div>
  );
}
