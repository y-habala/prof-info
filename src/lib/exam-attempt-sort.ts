// Groups attempts by class, then by the student's roll number within that
// class — stored as text (see 0012 migration) so it's compared numerically
// here rather than lexicographically (otherwise "10" would sort before "2").
// Attempts with no roll number sort last within their class.
export function compareByClassAndNumber(
  a: { student_class: string | null; student_number: string | null },
  b: { student_class: string | null; student_number: string | null }
): number {
  const classCompare = (a.student_class ?? "").localeCompare(b.student_class ?? "");
  if (classCompare !== 0) return classCompare;

  const numA = a.student_number ? parseInt(a.student_number, 10) : NaN;
  const numB = b.student_number ? parseInt(b.student_number, 10) : NaN;
  if (Number.isNaN(numA) && Number.isNaN(numB)) return 0;
  if (Number.isNaN(numA)) return 1;
  if (Number.isNaN(numB)) return -1;
  return numA - numB;
}
