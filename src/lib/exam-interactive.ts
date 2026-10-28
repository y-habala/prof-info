import { shuffleSeeded } from "@/lib/shuffle";

// Interactive exam question types. They reuse exam_options: one option row
// per pair / item, the two sides joined by PAIR_SEP in option_text, and the
// row order (order_index) as the correct order for "ordering".
//   association: "left||right"   — link each left item to its right item
//   ordering:    "item"          — put the items back in order
//   table:       "row||column"    — tick the right column on each row
// "ordering" is no longer offered for new questions but still renders and
// grades for the ones that exist.

export const INTERACTIVE_TYPES = ["association", "ordering", "table"] as const;
export type InteractiveType = (typeof INTERACTIVE_TYPES)[number];
export const isInteractive = (t: string): t is InteractiveType =>
  (INTERACTIVE_TYPES as readonly string[]).includes(t);

export const PAIR_SEP = "||";

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
  // Columns carry no hint of which row they belong to.
  return {
    items: ordered.map((o) => ({ id: o.id, text: splitPair(o.text)[0] })),
    categories: [...new Set(ordered.map((o) => splitPair(o.text)[1]).filter(Boolean))],
  };
}

function parseJson(raw: string | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Fraction of the points earned (0..1) and a readable version of the answer. */
export function gradeInteractive(
  type: InteractiveType,
  options: StoredOption[],
  rawAnswer: string | undefined,
  seed: string
): { fraction: number; answerText: string } {
  const ordered = byOrder(options);
  const total = ordered.length;
  if (total === 0) return { fraction: 0, answerText: "" };
  const answer = parseJson(rawAnswer);

  if (type === "association") {
    const map = answer && typeof answer === "object" && !Array.isArray(answer) ? (answer as Record<string, string>) : {};
    const rights = new Map(associationRights(options, seed).map((r) => [r.id, r]));
    let good = 0;
    const parts: string[] = [];
    for (const o of ordered) {
      const chosen = rights.get(map[o.id]);
      // Compared by text: two pairs may share the same right-hand side.
      if (chosen && chosen.text === splitPair(o.text)[1]) good++;
      parts.push(`${splitPair(o.text)[0]} → ${chosen ? chosen.text : "?"}`);
    }
    return { fraction: good / total, answerText: parts.join(" ; ") };
  }

  if (type === "ordering") {
    const ids = Array.isArray(answer) ? (answer as string[]) : [];
    const good = ordered.filter((o, i) => ids[i] === o.id).length;
    const text = new Map(ordered.map((o) => [o.id, o.text.trim()]));
    return { fraction: good / total, answerText: ids.map((id) => text.get(id) ?? "?").join(" > ") };
  }

  const map = answer && typeof answer === "object" && !Array.isArray(answer) ? (answer as Record<string, string>) : {};
  let good = 0;
  const parts: string[] = [];
  for (const o of ordered) {
    const [item, category] = splitPair(o.text);
    if (map[o.id] && map[o.id] === category) good++;
    parts.push(`${item} → ${map[o.id] ?? "?"}`);
  }
  return { fraction: good / total, answerText: parts.join(" ; ") };
}

/** Readable correct answer, for the corrected answer sheet. */
export function correctAnswerText(type: InteractiveType, options: StoredOption[]): string {
  const ordered = byOrder(options);
  if (type === "ordering") return ordered.map((o) => o.text.trim()).join(" > ");
  return ordered.map((o) => splitPair(o.text).join(" → ")).join(" ; ");
}
