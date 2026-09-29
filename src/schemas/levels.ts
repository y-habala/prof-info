import { z } from "zod";

export const levelFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().optional(),
});
