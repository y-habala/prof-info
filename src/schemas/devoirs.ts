import { z } from "zod";

export const DEVOIR_SESSIONS = ["semestre1", "semestre2"] as const;
export type DevoirSession = (typeof DEVOIR_SESSIONS)[number];

export const DEVOIR_SESSION_LABELS: Record<DevoirSession, string> = {
  semestre1: "Semestre 1",
  semestre2: "Semestre 2",
};

export const devoirFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  levelId: z.string().uuid("Choisissez un niveau."),
  session: z.enum(DEVOIR_SESSIONS),
});
