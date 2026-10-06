import { z } from "zod";

export const EXAM_QUESTION_TYPES = ["qcm_single", "qcm_multiple", "true_false", "fill_blank", "matching"] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

export const EXAM_QUESTION_TYPE_LABELS: Record<ExamQuestionType, string> = {
  qcm_single: "QCM — choix unique",
  qcm_multiple: "QCM — choix multiples",
  true_false: "Vrai / Faux",
  fill_blank: "Texte à trous",
  matching: "Appariement",
};

// Parent exam (the test itself — one per level, N models hang off it)
export const examFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  levelId: z.string().uuid().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive().default(60),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  maxAttempts: z.coerce.number().int().positive().default(1),
});

// Child model (A, B, C, D — each is a variant of the parent exam with its
// own code + its own questions). label is admin-chosen (usually a single
// letter but anything short); secret_code must be unique across the whole
// exam_models table (globally — one student uses one code).
export const examModelFormSchema = z.object({
  label: z.string().trim().min(1, "Le libellé est requis.").max(10),
  secretCode: z.string().regex(/^\d{4}$/, "Le code doit contenir 4 chiffres."),
});

export const examSectionFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  imageUrl: z.string().trim().url("URL invalide.").optional().or(z.literal("")),
});

export const examQuestionFormSchema = z.object({
  questionText: z.string().trim().min(1, "La question est requise.").max(5000),
  questionType: z.enum(EXAM_QUESTION_TYPES),
  points: z.coerce.number().positive().default(1),
});

// Student-facing: entering an exam code + their identity.
export const examVerifySchema = z.object({
  secretCode: z.string().regex(/^\d{4}$/),
  studentFirstName: z.string().trim().min(1).max(100),
  studentName: z.string().trim().min(1).max(100),
  studentClass: z.string().trim().min(1).max(30),
  studentNumber: z.string().trim().min(1).max(20),
});
