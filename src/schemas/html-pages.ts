import { z } from "zod";

// Keep srcdoc payloads reasonable — see architecture doc §9 (large inline
// content bloats the RSC payload sent on every page load and is the
// flakiest on Safari/iOS). Media belongs in Storage, not inlined.
const MAX_CODE_LENGTH = 100_000;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const htmlPageFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Le slug est requis.")
    .max(100)
    .regex(slugPattern, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets."),
  levelId: z.string().uuid().optional().or(z.literal("")),
  unitId: z.string().uuid().optional().or(z.literal("")),
  sequenceId: z.string().uuid().optional().or(z.literal("")),
  sessionId: z.string().uuid().optional().or(z.literal("")),
  htmlContent: z.string().max(MAX_CODE_LENGTH).default(""),
  cssContent: z.string().max(MAX_CODE_LENGTH).default(""),
  javascriptContent: z.string().max(MAX_CODE_LENGTH).default(""),
});
