// Sort attempts by class, then numerically by student_number (which is
// text, so a plain lexicographic sort would put "10" before "2"). Nulls
// trail at the end within each class.
export type SortableAttempt = {
  student_class: string | null;
  student_number: string | null;
  student_name: string;
  student_first_name: string;
};

export function compareByClassAndNumber(a: SortableAttempt, b: SortableAttempt): number {
  const ac = a.student_class ?? "";
  const bc = b.student_class ?? "";
  if (ac !== bc) return ac.localeCompare(bc, "fr");

  const an = a.student_number;
  const bn = b.student_number;
  if (an && bn) {
    const anum = Number(an);
    const bnum = Number(bn);
    if (!Number.isNaN(anum) && !Number.isNaN(bnum)) return anum - bnum;
    return an.localeCompare(bn, "fr");
  }
  if (an && !bn) return -1;
  if (!an && bn) return 1;

  const alast = `${a.student_name} ${a.student_first_name}`;
  const blast = `${b.student_name} ${b.student_first_name}`;
  return alast.localeCompare(blast, "fr");
}
