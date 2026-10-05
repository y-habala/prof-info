// Shared "note sur 20" conversion + appreciation wording — used by the PDF
// answer sheet, the Excel export, and the student-facing result page alike,
// so the same score always reads the same way everywhere in the app.

// Always /20 regardless of the exam's own max_score — the usual "note"
// convention — and explicitly clamped even though score <= max_score should
// already guarantee it, matching the defensive clamp the teacher's own
// reference exam file applies before displaying a score.
export function scoreOutOf20(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.min(20, (score / maxScore) * 20);
}

export function getAppreciation(score20: number): string {
  if (score20 >= 18) return "Excellent !";
  if (score20 >= 15) return "Très bien.";
  if (score20 >= 12) return "Bien.";
  if (score20 >= 10) return "Passable.";
  return "Insuffisant.";
}
