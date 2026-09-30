import { z } from "zod";

export const examFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  levelId: z.string().uuid().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive(),
  secretCode: z.string().regex(/^\d{4}$/, "Le code doit contenir exactement 4 chiffres."),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  maxAttempts: z.coerce.number().int().positive().default(1),
});

// exam_questions' DB check constraint only allows these 5 — no matching/
// ordering (same reasoning as exercises), and no image_url/explanation
// columns at all on this table (unlike exercise_questions).
export const EXAM_QUESTION_TYPES = ["qcm_single", "qcm_multiple", "true_false", "fill_blank", "open"] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

export const EXAM_QUESTION_TYPE_LABELS: Record<ExamQuestionType, string> = {
  qcm_single: "QCM - choix unique",
  qcm_multiple: "QCM - choix multiples",
  true_false: "Vrai / Faux",
  fill_blank: "Texte à trous",
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
// group by class in the devoir report (free text would defeat that).
export const examVerifySchema = z.object({
  secretCode: z.string().regex(/^\d{4}$/),
  studentName: z.string().trim().min(1).max(100),
  studentFirstName: z.string().trim().min(1).max(100),
  classNumber: z.coerce.number().int().positive().max(999),
});
