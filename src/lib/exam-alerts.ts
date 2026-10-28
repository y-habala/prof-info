import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { classKey, matchName, nameKey, nameTokens } from "@/lib/massar/name-match";

export type ExamAlert = {
  kind: "duplicate" | "number" | "unknown";
  examId: string;
  examTitle: string;
  className: string;
  message: string;
};

type Attempt = {
  exam_model_id: string;
  student_name: string;
  student_first_name: string;
  student_class: string | null;
  student_number: string | null;
  started_at: string;
};

const schoolYearOf = (iso: string) => {
  const d = new Date(iso);
  const start = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}/${start + 1}`;
};

// PostgREST caps a response at 1000 rows.
async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await query(from, from + 999);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

// Anomalies in exam attempts the teacher should look at: a student who sat
// the same exam twice, a class number shared by different names, and names
// that match nobody on the imported Massar class list.
export async function computeExamAlerts(supabase: SupabaseClient): Promise<ExamAlert[]> {
  const [{ data: exams }, { data: models }, attempts] = await Promise.all([
    supabase.from("exams").select("id, title"),
    supabase.from("exam_models").select("id, exam_id"),
    fetchAll<Attempt>((from, to) =>
      supabase
        .from("exam_attempts")
        .select("exam_model_id, student_name, student_first_name, student_class, student_number, started_at")
        .order("started_at")
        .range(from, to)
    ),
  ]);
  const examTitle = new Map((exams ?? []).map((e) => [e.id as string, e.title as string]));
  const examOfModel = new Map((models ?? []).map((m) => [m.id as string, m.exam_id as string]));

  // Massar rosters per class, for each school year that has imported files.
  const sheets = await fetchAll<{ id: string; school_year: string; class_name: string }>((from, to) =>
    supabase.from("cc_sheets").select("id, school_year, class_name").range(from, to)
  );
  const sheetKey = new Map(sheets.map((s) => [s.id, `${s.school_year}|${classKey(s.class_name)}`]));
  const ccStudents = sheets.length
    ? await fetchAll<{ sheet_id: string; full_name: string }>((from, to) =>
        supabase.from("cc_students").select("sheet_id, full_name").order("id").range(from, to)
      )
    : [];
  const rosters = new Map<string, Map<string, { tokens: string[]; item: string }>>();
  for (const st of ccStudents) {
    const key = sheetKey.get(st.sheet_id);
    if (!key) continue;
    const roster = rosters.get(key) ?? new Map();
    roster.set(nameKey(st.full_name), { tokens: nameTokens(st.full_name), item: st.full_name });
    rosters.set(key, roster);
  }

  const alerts: ExamAlert[] = [];
  const byName = new Map<string, Attempt[]>();
  const byNumber = new Map<string, { names: Map<string, string>; className: string }>();
  const unknownSeen = new Set<string>();

  for (const a of attempts) {
    const examId = examOfModel.get(a.exam_model_id);
    if (!examId) continue;
    const cls = classKey(a.student_class);
    const fullName = `${a.student_name} ${a.student_first_name}`.trim();
    const key = nameKey(fullName);

    const k1 = `${examId}|${cls}|${key}`;
    byName.set(k1, [...(byName.get(k1) ?? []), a]);

    if (a.student_number?.trim()) {
      const k2 = `${examId}|${cls}|${a.student_number.trim()}`;
      const entry = byNumber.get(k2) ?? { names: new Map<string, string>(), className: a.student_class ?? "—" };
      if (!entry.names.has(key)) entry.names.set(key, fullName);
      byNumber.set(k2, entry);
    }

    const roster = rosters.get(`${schoolYearOf(a.started_at)}|${cls}`);
    if (roster && !unknownSeen.has(k1) && !matchName(fullName, [...roster.values()])) {
      unknownSeen.add(k1);
      alerts.push({
        kind: "unknown",
        examId,
        examTitle: examTitle.get(examId) ?? "?",
        className: a.student_class ?? "—",
        message: `« ${fullName} » ne correspond à aucun élève de la liste Massar de ${a.student_class}.`,
      });
    }
  }

  for (const [k, list] of byName) {
    if (list.length < 2) continue;
    const [examId] = k.split("|");
    const a = list[0];
    alerts.push({
      kind: "duplicate",
      examId,
      examTitle: examTitle.get(examId) ?? "?",
      className: a.student_class ?? "—",
      message: `${a.student_first_name} ${a.student_name} a passé cet examen ${list.length} fois.`,
    });
  }

  for (const [k, { names, className }] of byNumber) {
    if (names.size < 2) continue;
    const [examId, , number] = k.split("|");
    alerts.push({
      kind: "number",
      examId,
      examTitle: examTitle.get(examId) ?? "?",
      className,
      message: `Le N° ${number} est utilisé par ${names.size} noms différents : ${[...names.values()].join(", ")}.`,
    });
  }

  const order = { duplicate: 0, number: 1, unknown: 2 };
  return alerts.sort((x, y) => order[x.kind] - order[y.kind] || x.examTitle.localeCompare(y.examTitle, "fr"));
}
