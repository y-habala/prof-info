// Used to compare a student's fill-in-the-blank answer against the correct
// one leniently: case, accents ("é" vs "e"), and stray/extra whitespace
// shouldn't fail a genuinely correct answer.
export function normalizeAnswerText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
