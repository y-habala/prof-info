import { z } from "zod";

export const levelFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(100),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export const unitFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export const sequenceFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export const sessionFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  durationMinutes: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  contentMarkdown: z.string().max(50_000).optional().default(""),
  orderIndex: z.coerce.number().int().min(0).default(0),
});
