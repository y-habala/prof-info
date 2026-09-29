import { z } from "zod";

export const sessionFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive().optional(),
  orderIndex: z.coerce.number().int().optional(),
});
