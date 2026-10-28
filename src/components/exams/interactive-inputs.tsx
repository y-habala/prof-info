"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, X } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { InteractivePayload } from "@/lib/exam-interactive";

type Props = {
  payload: InteractivePayload;
  value: string | undefined;
  disabled: boolean;
  onChange: (json: string) => void;
};

function parse<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Distinct, print-safe colours to show which left item went with which right.
const PAIR_COLORS = [
  "bg-sky-100 border-sky-500 text-sky-900",
  "bg-amber-100 border-amber-500 text-amber-900",
  "bg-emerald-100 border-emerald-500 text-emerald-900",
  "bg-violet-100 border-violet-500 text-violet-900",
  "bg-rose-100 border-rose-500 text-rose-900",
  "bg-lime-100 border-lime-600 text-lime-900",
  "bg-orange-100 border-orange-500 text-orange-900",
  "bg-cyan-100 border-cyan-600 text-cyan-900",
  "bg-fuchsia-100 border-fuchsia-500 text-fuchsia-900",
  "bg-teal-100 border-teal-600 text-teal-900",
];

/* ── Association: click a left item, then its match on the right ── */
export function AssociationInput({ payload, value, disabled, onChange }: Props) {
  const links = parse<Record<string, string>>(value, {});
  const [active, setActive] = useState<string | null>(null);
  const rights = payload.rights ?? [];
  const colorOf = (leftId: string) => PAIR_COLORS[payload.items.findIndex((i) => i.id === leftId) % PAIR_COLORS.length];
  const leftOfRight = (rightId: string) => Object.keys(links).find((l) => links[l] === rightId);

  function link(rightId: string) {
    if (!active) return;
    const next = { ...links };
    for (const l of Object.keys(next)) if (next[l] === rightId) delete next[l];
    next[active] = rightId;
    onChange(JSON.stringify(next));
    setActive(null);
  }
  function unlink(leftId: string) {
    const next = { ...links };
    delete next[leftId];
    onChange(JSON.stringify(next));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Clique sur un élément de gauche, puis sur sa correspondance à droite.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {payload.items.map((it) => {
            const linked = links[it.id] != null;
            return (
              <div key={it.id} className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setActive(active === it.id ? null : it.id)}
                  className={cn(
                    "min-h-11 flex-1 rounded-xl border-2 px-3 py-2 text-left text-sm font-medium transition-all",
                    linked ? colorOf(it.id) : "border-border bg-card hover:border-primary/50",
                    active === it.id && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {it.text}
                </button>
                {linked && !disabled ? (
                  <button
                    type="button"
                    onClick={() => unlink(it.id)}
                    aria-label={`Délier ${it.text}`}
                    className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          {rights.map((r) => {
            const left = leftOfRight(r.id);
            return (
              <button
                key={r.id}
                type="button"
                disabled={disabled || !active}
                onClick={() => link(r.id)}
                className={cn(
                  "min-h-11 w-full rounded-xl border-2 px-3 py-2 text-left text-sm transition-all",
                  left ? colorOf(left) : "border-dashed border-border bg-card",
                  active && !disabled && "hover:border-primary hover:bg-primary/5 cursor-pointer",
                  !active && "cursor-default"
                )}
              >
                {r.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Ordering: drag (or arrows) into the right order ── */
function SortableRow({
  id,
  text,
  index,
  count,
  disabled,
  onMove,
}: {
  id: string;
  text: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border-2 border-border bg-card px-2 py-2 text-sm",
        isDragging && "z-10 border-primary shadow-lg"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Déplacer"
        className="cursor-grab touch-none rounded-md p-1 text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {index + 1}
      </span>
      <span className="flex-1 font-medium">{text}</span>
      <button
        type="button"
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label="Monter"
        className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label="Descendre"
        className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        <ArrowDown className="size-4" />
      </button>
    </li>
  );
}

export function OrderingInput({ payload, value, disabled, onChange }: Props) {
  const byId = new Map(payload.items.map((i) => [i.id, i]));
  const saved = parse<string[]>(value, []).filter((id) => byId.has(id));
  const order = saved.length === payload.items.length ? saved : payload.items.map((i) => i.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const move = (from: number, to: number) => onChange(JSON.stringify(arrayMove(order, from, to)));
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    move(order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id)));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Fais glisser les éléments (ou utilise les flèches) pour les remettre dans l&apos;ordre.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {order.map((id, i) => (
              <SortableRow
                key={id}
                id={id}
                text={byId.get(id)?.text ?? ""}
                index={i}
                count={order.length}
                disabled={disabled}
                onMove={move}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ── Table: tick the right column(s) on each row ── */
export function TableInput({ payload, value, disabled, onChange }: Props) {
  const raw = parse<Record<string, string[] | string>>(value, {});
  const chosen = (rowId: string) => {
    const v = raw[rowId];
    return Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
  };
  const columns = payload.categories ?? [];

  function pick(rowId: string, column: string) {
    const cur = chosen(rowId);
    const nextRow = cur.includes(column) ? cur.filter((c) => c !== column) : [...cur, column];
    const next: Record<string, string[]> = {};
    for (const it of payload.items) {
      const row = it.id === rowId ? nextRow : chosen(it.id);
      if (row.length > 0) next[it.id] = row;
    }
    onChange(JSON.stringify(next));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Coche la ou les bonnes cases sur chaque ligne.</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="border-b border-border px-3 py-2" />
              {columns.map((c) => (
                <th key={c} className="border-b border-l border-border px-3 py-2 text-center font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.items.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <th scope="row" className="bg-muted/30 px-3 py-2 text-left font-semibold">
                  {row.text}
                </th>
                {columns.map((c) => {
                  const on = chosen(row.id).includes(c);
                  return (
                    <td key={c} className="border-l border-border p-0 text-center">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => pick(row.id, c)}
                        aria-pressed={on}
                        aria-label={`${row.text} : ${c}`}
                        className={cn(
                          "flex h-11 w-full items-center justify-center transition-colors",
                          on ? "bg-primary/10" : "hover:bg-muted/60"
                        )}
                      >
                        {on ? (
                          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Check className="size-4" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="size-5 rounded-md border-2 border-muted-foreground/30" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Whether the student has given at least part of an answer. */
export function interactiveAnswered(type: string, value: string | undefined): boolean {
  if (!value) return false;
  const v = parse<unknown>(value, null);
  if (type === "ordering") return Array.isArray(v) && v.length > 0;
  return !!v && typeof v === "object" && Object.keys(v as object).length > 0;
}
