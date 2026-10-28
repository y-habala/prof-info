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
import { splitBox, type InteractivePayload } from "@/lib/exam-interactive";

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

// One colour per box, as on the paper exercise.
const BOX_COLORS = [
  { box: "border-orange-300 bg-orange-50", title: "text-orange-700", chip: "bg-orange-500" },
  { box: "border-cyan-300 bg-cyan-50", title: "text-cyan-700", chip: "bg-cyan-600" },
  { box: "border-violet-300 bg-violet-50", title: "text-violet-700", chip: "bg-violet-600" },
  { box: "border-indigo-300 bg-indigo-50", title: "text-indigo-700", chip: "bg-indigo-600" },
  { box: "border-emerald-300 bg-emerald-50", title: "text-emerald-700", chip: "bg-emerald-600" },
  { box: "border-rose-300 bg-rose-50", title: "text-rose-700", chip: "bg-rose-600" },
];

/* ── Boxes: click an item then a box (or drag it there) ── */
export function BoxesInput({ payload, value, disabled, onChange }: Props) {
  const raw = parse<Record<string, string[] | string>>(value, {});
  const placed = (id: string) => {
    const v = raw[id];
    return Array.isArray(v) ? v[0] : typeof v === "string" ? v : undefined;
  };
  const boxes = payload.categories ?? [];
  const [active, setActive] = useState<string | null>(null);
  const pool = payload.items.filter((it) => !placed(it.id));

  function put(itemId: string, box: string | null) {
    const next: Record<string, string[]> = {};
    for (const it of payload.items) {
      const b = it.id === itemId ? box : placed(it.id);
      if (b) next[it.id] = [b];
    }
    onChange(JSON.stringify(next));
    setActive(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Clique sur un élément, puis sur la bonne boîte (tu peux aussi le faire glisser). Clique sur un élément rangé
        pour le retirer.
      </p>

      {pool.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pool.map((it) => (
            <button
              key={it.id}
              type="button"
              draggable={!disabled}
              disabled={disabled}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", it.id)}
              onClick={() => setActive(active === it.id ? null : it.id)}
              className={cn(
                "min-h-12 rounded-xl border-2 bg-card px-4 py-2.5 text-left text-[15px] font-semibold transition-all",
                active === it.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:shadow-sm"
              )}
            >
              {it.text}
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
          Tous les éléments sont rangés. Tu peux encore les déplacer.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {boxes.map((b, bi) => {
          const c = BOX_COLORS[bi % BOX_COLORS.length];
          const { title, note } = splitBox(b);
          const inside = payload.items.filter((it) => placed(it.id) === b);
          return (
            <div
              key={b}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Ranger dans ${title}`}
              onClick={() => active && !disabled && put(active, b)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && active && !disabled) {
                  e.preventDefault();
                  put(active, b);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id && !disabled) put(id, b);
              }}
              className={cn(
                "flex min-h-32 flex-col rounded-2xl border-2 border-dashed p-3 transition-all",
                c.box,
                active && !disabled && "cursor-pointer hover:border-solid hover:shadow-md"
              )}
            >
              <div className="mb-2 text-center">
                <p className={cn("font-heading text-base font-bold", c.title)}>{title}</p>
                {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {inside.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    disabled={disabled}
                    draggable={!disabled}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", it.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      put(it.id, null);
                    }}
                    title="Retirer de la boîte"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-white shadow-sm",
                      c.chip
                    )}
                  >
                    {it.text}
                    <X className="size-3.5 opacity-80" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
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
                          on ? "bg-primary/20" : "hover:bg-muted/60"
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
