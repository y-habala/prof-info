// Shared grading helpers used by exam runner, result page, PDF report, and
// Excel export. Keeps the wording and the /20 conversion consistent across
// every surface in the app.

// Normalize any raw score/max_score pair to a value in [0, 20], defensively
// clamped — matches the convention used throughout the Moroccan collège
// grading system.
export function scoreOutOf20(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.min(20, (score / maxScore) * 20);
}

// Verbal appreciation for a /20 score. Thresholds reused in the student
// résultat page card AND the per-student PDF stamp, so they MUST stay in
// sync — one source of truth here.
export function getAppreciation(score20: number): string {
  if (score20 >= 18) return "Excellent !";
  if (score20 >= 15) return "Très bien.";
  if (score20 >= 12) return "Bien.";
  if (score20 >= 10) return "Passable.";
  return "Insuffisant.";
}
