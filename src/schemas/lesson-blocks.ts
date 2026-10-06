import { z } from "zod";

export const BLOCK_TYPES = ["text", "image", "video", "file", "exercise", "interactive"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Texte",
  image: "Image",
  video: "Vidéo",
  file: "Fichier (PDF/doc)",
  exercise: "Exercice",
  interactive: "Activité interactive",
};

// Content shapes per block type. The DB column is jsonb; these schemas
// enforce the shape when a block is created or updated.
export const textContentSchema = z.object({
  markdown: z.string().max(50_000).default(""),
});

export const imageContentSchema = z.object({
  url: z.string().trim().url("URL d'image invalide."),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
});

export const videoContentSchema = z.object({
  youtube_url: z.string().trim().url("URL YouTube invalide.").optional().or(z.literal("")),
  video_url: z.string().trim().url("URL vidéo invalide.").optional().or(z.literal("")),
}).refine(
  (v) => (v.youtube_url && v.youtube_url.length > 0) || (v.video_url && v.video_url.length > 0),
  { message: "Au moins une URL (YouTube ou directe) est requise." }
);

export const fileContentSchema = z.object({
  url: z.string().trim().url("URL de fichier invalide."),
  file_name: z.string().trim().max(200).optional().or(z.literal("")),
});

export const exerciseContentSchema = z.object({
  exercise_id: z.string().uuid("Choisir un exercice."),
});

export const interactiveContentSchema = z.object({
  html: z.string().max(100_000).default(""),
  css: z.string().max(50_000).default(""),
  js: z.string().max(50_000).default(""),
});

export const blockFormSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(BLOCK_TYPES),
});
