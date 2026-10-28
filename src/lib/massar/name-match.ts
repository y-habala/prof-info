// Name matching between what a student typed on the exam form and the Massar
// class list: accents, case, punctuation and word order are ignored.

export const nameTokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

export const nameKey = (s: string) => nameTokens(s).sort().join(" ");

export const classKey = (c: string | null) => (c ?? "").replace(/\s+/g, "").toUpperCase();

export type RosterEntry<T> = { tokens: string[]; item: T };

// Exact token match first, then a partial one (e.g. a missing second first
// name). Returns the single candidate, or null when none or several match.
export function matchName<T>(typed: string, roster: RosterEntry<T>[], exclude?: Set<T>): T | null {
  const tokens = nameTokens(typed);
  if (tokens.length === 0) return null;
  const key = [...tokens].sort().join(" ");
  const free = exclude ? roster.filter((r) => !exclude.has(r.item)) : roster;
  let candidates = free.filter((r) => [...r.tokens].sort().join(" ") === key);
  if (candidates.length !== 1) {
    candidates = free.filter(
      (r) => tokens.every((t) => r.tokens.includes(t)) || r.tokens.every((t) => tokens.includes(t))
    );
  }
  return candidates.length === 1 ? candidates[0].item : null;
}
