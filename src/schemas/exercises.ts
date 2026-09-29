import { z } from "zod";

export const exerciseFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  levelId: z.string().uuid().optional().or(z.literal("")),
  unitId: z.string().uuid().optional().or(z.literal("")),
  sequenceId: z.string().uuid().optional().or(z.literal("")),
  sessionId: z.string().uuid().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive().optional(),
});

// Available now; 'matching' and 'ordering' need dedicated UI/data shapes
// the current exercise_options table doesn't cleanly support (a single
// option_text + is_correct doesn't model pairs or a target order) — the DB
// check constraint already allows them, add here when that UI is built.
export const AVAILABLE_QUESTION_TYPES = [
  "qcm_single",
  "qcm_multiple",
  "true_false",
  "fill_blank",
  "open",
] as const;
export type QuestionType = (typeof AVAILABLE_QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  qcm_single: "QCM - choix unique",
  qcm_multiple: "QCM - choix multiples",
  true_false: "Vrai / Faux",
  fill_blank: "Texte à trous",
  open: "Question ouverte",
};

export const optionSchema = z.object({
  text: z.string().trim().min(1, "Le texte est requis.").max(500),
  isCorrect: z.boolean(),
});

export const questionFormSchema = z.object({
  questionText: z.string().trim().min(1, "La question est requise."),
  questionType: z.enum(AVAILABLE_QUESTION_TYPES),
  points: z.coerce.number().positive().default(1),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  explanation: z.string().trim().max(1000).optional().or(z.literal("")),
  options: z.array(optionSchema).default([]),
  correctText: z.string().trim().optional().or(z.literal("")), // fill_blank
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
