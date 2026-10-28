"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseMassarCcFile, MassarFileError } from "@/lib/massar/cc-file";
import { CONTROL_COUNT, ABSENCE_VALUES } from "@/lib/massar/cc-constants";
import { classKey, matchName, nameKey, nameTokens } from "@/lib/massar/name-match";

const PAGE = "/admin/controle-continu";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export type ImportResult = {
  fileName: string;
  ok: boolean;
  message: string;
};

type ExistingStudent = {
  student_code: string;
  note1: number | null;
  note2: number | null;
  note3: number | null;
  note4: number | null;
  abs1: string | null;
  abs2: string | null;
  abs3: string | null;
  abs4: string | null;
};

export async function importCcFiles(formData: FormData): Promise<{ results: ImportResult[]; error?: string }> {
  const supabase = await authed();
  if (!supabase) return { results: [], error: "Non autorisé." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { results: [], error: "Aucun fichier fourni." };

  const results: ImportResult[] = [];
  for (const file of files) {
    try {
      if (file.size > MAX_FILE_BYTES) throw new MassarFileError("Fichier trop lourd (5 Mo maximum).");
      const bytes = Buffer.from(await file.arrayBuffer());
      const parsed = await parseMassarCcFile(bytes);

      const { data: sheet, error: sheetError } = await supabase
        .from("cc_sheets")
        .upsert(
          {
            school_year: parsed.schoolYear,
            level_label: parsed.levelLabel,
            class_name: parsed.className,
            session_code: parsed.sessionCode,
            session_label: parsed.sessionLabel,
            teacher: parsed.teacher,
            establishment: parsed.establishment,
            massar_meta: parsed.massarMeta,
            source_file_name: file.name,
            source_file_b64: bytes.toString("base64"),
          },
          { onConflict: "school_year,class_name,session_code" }
        )
        .select("id")
        .single();
      if (sheetError || !sheet) throw new Error(sheetError?.message ?? "enregistrement impossible");

      const { data: existingRows } = await supabase
        .from("cc_students")
        .select("student_code, note1, note2, note3, note4, abs1, abs2, abs3, abs4")
        .eq("sheet_id", sheet.id);
      const existing = new Map(((existingRows ?? []) as ExistingStudent[]).map((s) => [s.student_code, s]));

      // A grade already in the file (re-export from Massar) wins; an empty
      // cell keeps whatever was entered here.
      const rows = parsed.students.map((st) => {
        const prev = existing.get(st.studentCode);
        const row: Record<string, unknown> = {
          sheet_id: sheet.id,
          row_number: st.rowNumber,
          massar_id: st.massarId,
          student_code: st.studentCode,
          full_name: st.fullName,
          birth_date: st.birthDate,
        };
        for (let i = 0; i < CONTROL_COUNT; i++) {
          const k = i + 1;
          row[`note${k}`] = st.notes[i] ?? (prev?.[`note${k}` as keyof ExistingStudent] ?? null);
          row[`abs${k}`] = st.absences[i] ?? (prev?.[`abs${k}` as keyof ExistingStudent] ?? null);
        }
        return row;
      });
      const { error: studentsError } = await supabase
        .from("cc_students")
        .upsert(rows, { onConflict: "sheet_id,student_code" });
      if (studentsError) throw new Error(studentsError.message);

      // Students no longer listed by Massar have left the class.
      const codes = parsed.students.map((s) => s.studentCode);
      const gone = [...existing.keys()].filter((c) => !codes.includes(c));
      if (gone.length > 0) {
        await supabase.from("cc_students").delete().eq("sheet_id", sheet.id).in("student_code", gone);
      }

      results.push({
        fileName: file.name,
        ok: true,
        message: `${parsed.className} — ${parsed.sessionLabel} ${parsed.schoolYear} : ${parsed.students.length} élèves importés.`,
      });
    } catch (e) {
      results.push({
        fileName: file.name,
        ok: false,
        message: e instanceof MassarFileError ? e.message : "Import impossible (erreur serveur).",
      });
      if (!(e instanceof MassarFileError)) console.error("[importCcFiles]", e);
    }
  }

  revalidatePath(PAGE);
  return { results };
}

export type GradeEntry = { id: string; note: string; absence: string };

export async function saveCcGrades(
  sheetId: string,
  control: number,
  entries: GradeEntry[]
): Promise<{ error?: string; saved?: number }> {
  const supabase = await authed();
  if (!supabase) return { error: "Non autorisé." };
  if (!Number.isInteger(control) || control < 1 || control > CONTROL_COUNT) return { error: "Contrôle invalide." };

  const updates: { id: string; note: number | null; absence: string | null }[] = [];
  for (const e of entries) {
    const raw = e.note.trim().replace(",", ".");
    let note: number | null = null;
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 20) return { error: `Note invalide : « ${e.note} » (entre 0 et 20).` };
      note = Math.round(n * 100) / 100;
    }
    const absence = (ABSENCE_VALUES as readonly string[]).includes(e.absence) ? e.absence : null;
    updates.push({ id: e.id, note, absence });
  }

  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from("cc_students")
        .update({ [`note${control}`]: u.note, [`abs${control}`]: u.absence })
        .eq("id", u.id)
        .eq("sheet_id", sheetId)
    )
  );
  if (results.some((r) => r.error)) return { error: "Une erreur est survenue pendant l'enregistrement." };

  revalidatePath(PAGE);
  return { saved: updates.length };
}

export type ExamFillResult = {
  error?: string;
  matches?: { studentId: string; note: string }[];
  unmatched?: string[];
  attemptCount?: number;
};

// Proposes contrôle continu grades from an exam's submitted attempts in the
// same class, matched by name. Nothing is saved: the UI fills the table and
// the teacher reviews before "Enregistrer".
export async function gradesFromExam(sheetId: string, examId: string): Promise<ExamFillResult> {
  const supabase = await authed();
  if (!supabase) return { error: "Non autorisé." };

  const [{ data: sheet }, { data: students }, { data: models }] = await Promise.all([
    supabase.from("cc_sheets").select("class_name").eq("id", sheetId).maybeSingle(),
    supabase.from("cc_students").select("id, full_name").eq("sheet_id", sheetId),
    supabase.from("exam_models").select("id").eq("exam_id", examId),
  ]);
  if (!sheet) return { error: "Classe introuvable." };
  const modelIds = (models ?? []).map((m) => m.id);
  if (modelIds.length === 0) return { error: "Cet examen n'a aucun modèle." };

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("student_name, student_first_name, student_class, score, max_score, submitted_at")
    .in("exam_model_id", modelIds)
    .not("submitted_at", "is", null);

  // One attempt per student: the most recently submitted.
  const latest = new Map<string, NonNullable<typeof attempts>[number]>();
  for (const a of (attempts ?? []).filter((a) => classKey(a.student_class) === classKey(sheet.class_name))) {
    const key = nameKey(`${a.student_name} ${a.student_first_name}`);
    const prev = latest.get(key);
    if (!prev || (a.submitted_at ?? "") > (prev.submitted_at ?? "")) latest.set(key, a);
  }

  const roster = (students ?? []).map((s) => ({ tokens: nameTokens(s.full_name), item: s.id }));
  const used = new Set<string>();
  const matches: { studentId: string; note: string }[] = [];
  const unmatched: string[] = [];

  for (const a of latest.values()) {
    const label = `${a.student_name} ${a.student_first_name}`.trim();
    const studentId = matchName(label, roster, used);
    const max = Number(a.max_score ?? 0);
    if (studentId && max > 0) {
      used.add(studentId);
      const note = Math.round(Math.min(20, (Number(a.score ?? 0) / max) * 20) * 100) / 100;
      matches.push({ studentId, note: String(note) });
    } else {
      unmatched.push(label);
    }
  }

  return { matches, unmatched, attemptCount: latest.size };
}

export async function deleteCcSheet(sheetId: string): Promise<{ error?: string }> {
  const supabase = await authed();
  if (!supabase) return { error: "Non autorisé." };
  const { error } = await supabase.from("cc_sheets").delete().eq("id", sheetId);
  if (error) return { error: "Suppression impossible." };
  revalidatePath(PAGE);
  return {};
}
