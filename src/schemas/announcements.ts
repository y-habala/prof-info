import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const announcementFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().max(20_000).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Le slug est requis.")
    .max(100)
    .regex(slugPattern, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets."),
  imageUrl: z.string().trim().url("URL d'image invalide.").max(2000).optional().or(z.literal("")),
});
