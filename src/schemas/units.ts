import { z } from "zod";

export const unitFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("URL invalide.").max(2000).optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().optional(),
});
