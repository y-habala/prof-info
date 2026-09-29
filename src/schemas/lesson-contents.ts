import { z } from "zod";

// 'interactive'/'html' still need Phase 13 (Activités HTML) data to pick
// from — the DB check constraint already allows them, add here once built.
export const AVAILABLE_BLOCK_TYPES = ["text", "image", "video", "pdf", "file", "exercise"] as const;
export type BlockType = (typeof AVAILABLE_BLOCK_TYPES)[number];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Texte",
  image: "Image",
  video: "Vidéo",
  pdf: "PDF",
  file: "Fichier",
  exercise: "Exercice",
};

const textContentSchema = z.object({
  text: z.string().trim().min(1, "Le texte est requis."),
});
const imageContentSchema = z.object({
  url: z.string().trim().url("URL invalide."),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
});
const videoContentSchema = z
  .object({
    youtube_url: z.string().trim().url("URL invalide.").optional().or(z.literal("")),
    video_url: z.string().trim().url("URL invalide.").optional().or(z.literal("")),
  })
  .refine((v) => v.youtube_url || v.video_url, {
    message: "Indiquez une URL YouTube ou une URL vidéo directe.",
  });
const fileContentSchema = z.object({
  file_url: z.string().trim().url("URL invalide."),
  file_name: z.string().trim().min(1, "Le nom du fichier est requis.").max(200),
});
const exerciseContentSchema = z.object({
  exercise_id: z.string().uuid("Choisissez un exercice."),
});

export const blockContentSchemas: Record<BlockType, z.ZodType> = {
  text: textContentSchema,
  image: imageContentSchema,
  video: videoContentSchema,
  pdf: fileContentSchema,
  file: fileContentSchema,
  exercise: exerciseContentSchema,
};

export const blockTitleSchema = z.string().trim().max(200).optional().or(z.literal(""));
