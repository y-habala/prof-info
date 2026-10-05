// Accent/case/whitespace-insensitive match for fill-in-the-blank answers.
// "Réseau" and "reseau" should both count — this is pedagogical quizzing,
// not a password check.
export function normalizeAnswerText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
