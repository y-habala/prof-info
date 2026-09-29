import { z } from "zod";

export const accessCodeSchema = z.object({
  code: z.string().regex(/^\d{4}$/, "Le code doit contenir exactement 4 chiffres."),
});
