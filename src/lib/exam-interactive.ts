import { shuffleSeeded } from "@/lib/shuffle";

// Interactive exam question types. They reuse exam_options: one option row
// per pair / item, the two sides joined by PAIR_SEP in option_text, and the
// row order (order_index) as the correct order for "ordering".
//   association: "left||right"            — link each left item to its right item
//   ordering:    "item"                   — put the items back in order
//   table:       "row||colA&&colB"        — tick the right column(s) on each row
//                "#COLS#||A&&B&&C"         — optional header fixing the columns
// "ordering" is no longer offered for new questions but still renders and
// grades for the ones that exist.

export const INTERACTIVE_TYPES = ["association", "ordering", "table"] as const;
export type InteractiveType = (typeof INTERACTIVE_TYPES)[number];
export const isInteractive = (t: string): t is InteractiveType =>
  (INTERACTIVE_TYPES as readonly string[]).includes(t);

export const PAIR_SEP = "||";
export const COL_SEP = "&&";
export const COLS_MARK = "#COLS#";

export function splitPair(text: string): [string, string] {
  const i = text.indexOf(PAIR_SEP);
  if (i < 0) return [text.trim(), ""];
  return [text.slice(0, i).trim(), text.slice(i + PAIR_SEP.length).trim()];
}

export type StoredOption = { id: string; text: string; orderIndex: number };

/** What the student's browser receives: never the pairing or the order. */
export type InteractivePayload = {
  items: { id: string; text: string }[];
  rights?: { id: string; text: string }[];
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

// Right-hand column of an association, shuffled per attempt. Its ids are
// positions in this shuffle, so they say nothing about which left item they
// belong to; the server rebuilds the same shuffle to grade.
function associationRights(options: StoredOption[], seed: string) {
  return shuffleSeeded(byOrder(options), `${seed}:rights`).map((o, i) => ({
    id: String(i),
    text: splitPair(o.text)[1],
    optionId: o.id,
  }));
}

export function buildInteractivePayload(type: InteractiveType, options: StoredOption[], seed: string): InteractivePayload {
  const ordered = byOrder(options);
  if (type === "association") {
    return {
      items: shuffleSeeded(ordered, `${seed}:lefts`).map((o) => ({ id: o.id, text: splitPair(o.text)[0] })),
      rights: associationRights(options, seed).map(({ id, text }) => ({ id, text })),
    };
  }
  if (type === "ordering") {
    let items = shuffleSeeded(ordered, `${seed}:order`);
    // Never hand out the list already in the right order.
    if (items.length > 1 && items.every((o, i) => o.id === ordered[i].id)) items = [...items.slice(1), items[0]];
    return { items: items.map((o) => ({ id: o.id, text: o.text.trim() })) };
  }
  // Table: rows and columns keep the teacher's order, like the paper sheet.
  // Only the labels are sent, never which boxes are right.
  const { columns, rows } = parseTable(options);
  return { items: rows.map((r) => ({ id: r.id, text: r.text })), categories: columns };
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

/** Fraction of the points earned (0..1) and a readable version of the answer. */
export function gradeInteractive(
  type: InteractiveType,
  options: StoredOption[],
  rawAnswer: string | undefined,
  seed: string
): { fraction: number; answerText: string } {
  const ordered = byOrder(options);
  if (ordered.length === 0) return { fraction: 0, answerText: "" };
  const answer = parseJson(rawAnswer);

  if (type === "association") {
    const map = asObject(answer);
    const rights = new Map(associationRights(options, seed).map((r) => [r.id, r]));
    let good = 0;
    const parts: string[] = [];
    for (const o of ordered) {
      const chosen = rights.get(String(map[o.id]));
      // Compared by text: two pairs may share the same right-hand side.
      if (chosen && chosen.text === splitPair(o.text)[1]) good++;
      parts.push(`${splitPair(o.text)[0]} → ${chosen ? chosen.text : "?"}`);
    }
    return { fraction: good / ordered.length, answerText: parts.join(" ; ") };
  }

  if (type === "ordering") {
    const ids = Array.isArray(answer) ? (answer as string[]) : [];
    const good = ordered.filter((o, i) => ids[i] === o.id).length;
    const text = new Map(ordered.map((o) => [o.id, o.text.trim()]));
    return { fraction: good / ordered.length, answerText: ids.map((id) => text.get(id) ?? "?").join(" > ") };
  }

  // Table: a row scores when its ticked boxes are exactly the right ones.
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
    parts.push(`${r.text} → ${ticked.length ? ticked.join(" + ") : "?"}`);
  }
  return { fraction: good / rows.length, answerText: parts.join(" ; ") };
}

/** Readable correct answer, for the corrected answer sheet. */
export function correctAnswerText(type: InteractiveType, options: StoredOption[]): string {
  const ordered = byOrder(options);
  if (type === "ordering") return ordered.map((o) => o.text.trim()).join(" > ");
  if (type === "table") return parseTable(options).rows.map((r) => `${r.text} → ${r.correct.join(" + ")}`).join(" ; ");
  return ordered.map((o) => splitPair(o.text).join(" → ")).join(" ; ");
}
