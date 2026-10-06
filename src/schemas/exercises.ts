import { z } from "zod";

export const EXERCISE_QUESTION_TYPES = ["qcm_single", "qcm_multiple", "true_false", "fill_blank", "matching"] as const;
export type ExerciseQuestionType = (typeof EXERCISE_QUESTION_TYPES)[number];

export const EXERCISE_QUESTION_TYPE_LABELS: Record<ExerciseQuestionType, string> = {
  qcm_single: "QCM — choix unique",
  qcm_multiple: "QCM — choix multiples",
  true_false: "Vrai / Faux",
  fill_blank: "Texte à trous",
  matching: "Appariement",
};

export const exerciseFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  levelId: z.string().uuid().optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export const exerciseQuestionFormSchema = z.object({
  questionText: z.string().trim().min(1, "La question est requise.").max(5000),
  questionType: z.enum(EXERCISE_QUESTION_TYPES),
  points: z.coerce.number().positive().default(1),
});
