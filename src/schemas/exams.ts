import { z } from "zod";

export const SEMESTERS = ["semestre1", "semestre2"] as const;
export type Semester = (typeof SEMESTERS)[number];
export const SEMESTER_LABELS: Record<Semester, string> = {
  semestre1: "Semestre 1",
  semestre2: "Semestre 2",
};

export const examFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  levelId: z.string().uuid().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive(),
  secretCode: z.string().regex(/^\d{4}$/, "Le code doit contenir exactement 4 chiffres."),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  maxAttempts: z.coerce.number().int().positive().default(1),
  // Both optional and independent — an exam not part of a formal "devoir"
  // series just leaves these unset, and simply won't surface in the
  // devoir-grouped results view. Several exam rows ("modèles", each its own
  // secret_code, the teacher's own anti-cheating practice) sharing the same
  // level + devoirNumber + semester are what the grouped report aggregates.
  devoirNumber: z.coerce.number().int().positive().optional().or(z.literal("")),
  semester: z.enum(SEMESTERS).optional().or(z.literal("")),
});

// exam_questions' DB check constraint allows these 6 — no "ordering" (same
// reasoning as exercises), and no image_url/explanation columns at all on
// this table (unlike exercise_questions). "matching" is modeled as a
// repeated qcm_single (see createMatchingSet in actions/exam-questions.ts),
// not a distinct data shape.
export const EXAM_QUESTION_TYPES = [
  "qcm_single",
  "qcm_multiple",
  "true_false",
  "fill_blank",
  "matching",
  "open",
] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

export const EXAM_QUESTION_TYPE_LABELS: Record<ExamQuestionType, string> = {
  qcm_single: "QCM - choix unique",
  qcm_multiple: "QCM - choix multiples",
  true_false: "Vrai / Faux",
  fill_blank: "Texte à trous",
  matching: "Appariement",
  open: "Question ouverte",
};

export const examOptionSchema = z.object({
  text: z.string().trim().min(1, "Le texte est requis.").max(500),
  isCorrect: z.boolean(),
});

export const examQuestionFormSchema = z.object({
  questionText: z.string().trim().min(1, "La question est requise."),
  questionType: z.enum(EXAM_QUESTION_TYPES),
  points: z.coerce.number().positive().default(1),
  options: z.array(examOptionSchema).default([]),
  correctText: z.string().trim().optional().or(z.literal("")), // fill_blank
});

export type ExamQuestionFormValues = z.infer<typeof examQuestionFormSchema>;

// /exam entry form — secret code + student identity (no accounts, so
// max_attempts is matched on name+firstname only — a documented, accepted
// limitation, see architecture doc). The student never picks a level (the
// exam's own level_id fixes it) — only their class NUMBER within that level,
// so the server can build a canonical "Niveau-N" label reliable enough to
// group by class in the per-exam class report (free text would defeat that).
export const examVerifySchema = z.object({
  secretCode: z.string().regex(/^\d{4}$/),
  studentName: z.string().trim().min(1).max(100),
  studentFirstName: z.string().trim().min(1).max(100),
  classNumber: z.coerce.number().int().positive().max(999),
  // Roll number within the class — optional, never validated in the
  // reference exam either. Kept as text (not coerced to a number) since
  // it's an identifier, not a quantity, and shouldn't lose a leading zero.
  studentNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

// A shared option pool used once for several matching pairs (see
// createMatchingSet) — authored together so every pair's dropdown shows the
// exact same choices, rather than the admin retyping the pool per pair and
// risking drift (a typo or reordering making "the same" set inconsistent).
export const matchingSetSchema = z.object({
  pool: z.array(z.string().trim().min(1).max(500)).min(2, "Au moins 2 termes sont requis."),
  pairs: z
    .array(
      z.object({
        prompt: z.string().trim().min(1, "Le terme est requis.").max(500),
        correctPoolIndex: z.coerce.number().int().min(0),
      })
    )
    .min(1, "Au moins une paire est requise."),
  points: z.coerce.number().positive().default(0.5),
});
export type MatchingSetFormValues = z.infer<typeof matchingSetSchema>;

export const examSectionFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
});
