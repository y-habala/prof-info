import { shuffleSeeded } from "@/lib/shuffle";

// Interactive exam question types. They reuse exam_options: one option row
// per item, the two sides joined by PAIR_SEP in option_text, and the row
// order (order_index) as the correct order for "ordering".
//   ordering: "item"                — put the items back in order
//   table:    "row||colA&&colB"     — tick the right column(s) on each row
//   boxes:    "item||Box"           — drop each item into its box
//   header:   "#COLS#||A&&B&&C"     — optional, fixes the columns / boxes
// A box name may carry a description after BOX_NOTE_SEP ("PAN :: une
// personne"). "ordering" is no longer offered for new questions but still
// renders and grades for the ones that exist.

export const INTERACTIVE_TYPES = ["ordering", "table", "boxes"] as const;
export type InteractiveType = (typeof INTERACTIVE_TYPES)[number];
export const isInteractive = (t: string): t is InteractiveType =>
  (INTERACTIVE_TYPES as readonly string[]).includes(t);

export const PAIR_SEP = "||";
export const COL_SEP = "&&";
export const COLS_MARK = "#COLS#";
export const BOX_NOTE_SEP = "::";

export function splitPair(text: string): [string, string] {
  const i = text.indexOf(PAIR_SEP);
  if (i < 0) return [text.trim(), ""];
  return [text.slice(0, i).trim(), text.slice(i + PAIR_SEP.length).trim()];
}

/** "PAN :: une personne" → { title: "PAN", note: "une personne" }. */
export function splitBox(name: string): { title: string; note: string } {
  const i = name.indexOf(BOX_NOTE_SEP);
  if (i < 0) return { title: name.trim(), note: "" };
  return { title: name.slice(0, i).trim(), note: name.slice(i + BOX_NOTE_SEP.length).trim() };
}

export type StoredOption = { id: string; text: string; orderIndex: number };

/** What the student's browser receives: never which column / box is right. */
export type InteractivePayload = {
  items: { id: string; text: string }[];
  categories?: string[];
};

const byOrder = (opts: StoredOption[]) => [...opts].sort((a, b) => a.orderIndex - b.orderIndex);

const splitCols = (s: string) =>
  s
    .split(COL_SEP)
    .map((c) => c.trim())
    .filter(Boolean);

export type TableRow = { id: string; text: string; correct: string[] };

/** Columns (header first, else order of first use) and rows with their correct columns. */
export function parseTable(options: StoredOption[]): { columns: string[]; rows: TableRow[] } {
  const ordered = byOrder(options);
  const header = ordered.find((o) => splitPair(o.text)[0] === COLS_MARK);
  const rows = ordered
    .filter((o) => o !== header)
    .map((o) => {
      const [text, right] = splitPair(o.text);
      return { id: o.id, text, correct: splitCols(right) };
    });
  const used = [...new Set(rows.flatMap((r) => r.correct))];
  const columns = header ? splitCols(splitPair(header.text)[1]) : used;
  // A column ticked on a row but missing from the header still shows up.
  for (const c of used) if (!columns.includes(c)) columns.push(c);
  return { columns, rows };
}

export function buildInteractivePayload(type: InteractiveType, options: StoredOption[], seed: string): InteractivePayload {
  const ordered = byOrder(options);
  if (type === "ordering") {
    let items = shuffleSeeded(ordered, `${seed}:order`);
    // Never hand out the list already in the right order.
    if (items.length > 1 && items.every((o, i) => o.id === ordered[i].id)) items = [...items.slice(1), items[0]];
    return { items: items.map((o) => ({ id: o.id, text: o.text.trim() })) };
  }
  // Table and boxes: only the labels are sent, never which column is right.
  // Table rows keep the teacher's order like the paper sheet; the items to
  // sort into boxes are shuffled per student.
  const { columns, rows } = parseTable(options);
  const items = rows.map((r) => ({ id: r.id, text: r.text }));
  return { items: type === "boxes" ? shuffleSeeded(items, `${seed}:items`) : items, categories: columns };
}

function parseJson(raw: string | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const asObject = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const label = (type: InteractiveType, column: string) => (type === "boxes" ? splitBox(column).title : column);

/** Fraction of the points earned (0..1) and a readable version of the answer. */
export function gradeInteractive(
  type: InteractiveType,
  options: StoredOption[],
  rawAnswer: string | undefined
): { fraction: number; answerText: string } {
  const ordered = byOrder(options);
  if (ordered.length === 0) return { fraction: 0, answerText: "" };
  const answer = parseJson(rawAnswer);

  if (type === "ordering") {
    const ids = Array.isArray(answer) ? (answer as string[]) : [];
    const good = ordered.filter((o, i) => ids[i] === o.id).length;
    const text = new Map(ordered.map((o) => [o.id, o.text.trim()]));
    return { fraction: good / ordered.length, answerText: ids.map((id) => text.get(id) ?? "?").join(" > ") };
  }

  // Table / boxes: a row scores when its chosen columns are exactly the right ones.
  const { rows } = parseTable(options);
  if (rows.length === 0) return { fraction: 0, answerText: "" };
  const map = asObject(answer);
  let good = 0;
  const parts: string[] = [];
  for (const r of rows) {
    const raw = map[r.id];
    // Older answers stored a single column as a string.
    const ticked = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? [raw] : [];
    const same = ticked.length === r.correct.length && r.correct.every((c) => ticked.includes(c));
    if (same && r.correct.length > 0) good++;
    parts.push(`${r.text} → ${ticked.length ? ticked.map((c) => label(type, c)).join(" + ") : "?"}`);
  }
  return { fraction: good / rows.length, answerText: parts.join(" ; ") };
}

/** Readable correct answer, for the corrected answer sheet. */
export function correctAnswerText(type: InteractiveType, options: StoredOption[]): string {
  if (type === "ordering") return byOrder(options).map((o) => o.text.trim()).join(" > ");
  return parseTable(options)
    .rows.map((r) => `${r.text} → ${r.correct.map((c) => label(type, c)).join(" + ")}`)
    .join(" ; ");
}
