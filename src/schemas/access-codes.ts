import { z } from "zod";

export const accessCodeFormSchema = z.object({
  code: z.string().regex(/^\d{4}$/, "Le code doit contenir exactement 4 chiffres."),
  label: z.string().trim().max(200).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});
