import { z } from "zod";

// The DB check constraint also allows 'interactive' as a synonym for the
// same { html_page_id } shape — unused here on purpose, one clear type
// name ("html", matching the admin nav label "Activités HTML") is simpler
// than offering two picker buttons that do the exact same thing.
export const AVAILABLE_BLOCK_TYPES = ["text", "image", "video", "pdf", "file", "exercise", "html"] as const;
export type BlockType = (typeof AVAILABLE_BLOCK_TYPES)[number];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Texte",
  image: "Image",
  video: "Vidéo",
  pdf: "PDF",
  file: "Fichier",
  exercise: "Exercice",
  html: "Activité HTML",
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
const htmlContentSchema = z.object({
  html_page_id: z.string().uuid("Choisissez une activité HTML."),
});

export const blockContentSchemas: Record<BlockType, z.ZodType> = {
  text: textContentSchema,
  image: imageContentSchema,
  video: videoContentSchema,
  pdf: fileContentSchema,
  file: fileContentSchema,
  exercise: exerciseContentSchema,
  html: htmlContentSchema,
};

export const blockTitleSchema = z.string().trim().max(200).optional().or(z.literal(""));
