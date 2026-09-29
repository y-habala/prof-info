"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/admin/files/file-upload-field";
import type { BlockType } from "@/schemas/lesson-contents";

export type BlockContentValues = {
  text?: string;
  url?: string;
  caption?: string;
  youtube_url?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
};

export function BlockFormFields({
  type,
  initialValues,
}: {
  type: BlockType;
  initialValues?: BlockContentValues;
}) {
  const [imageUrl, setImageUrl] = useState(initialValues?.url ?? "");
  const [fileUrl, setFileUrl] = useState(initialValues?.file_url ?? "");
  const [fileName, setFileName] = useState(initialValues?.file_name ?? "");

  switch (type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor="content_text">Texte</Label>
          <Textarea
            id="content_text"
            name="content_text"
            rows={6}
            defaultValue={initialValues?.text}
            required
          />
        </div>
      );
    case "image":
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="content_url">URL de l&apos;image</Label>
            <Input
              id="content_url"
              name="content_url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />
            <FileUploadField
              bucket="lesson-images"
              accept="image/*"
              onUploaded={(url) => setImageUrl(url)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content_caption">Légende (optionnel)</Label>
            <Input id="content_caption" name="content_caption" defaultValue={initialValues?.caption} />
          </div>
        </>
      );
    case "video":
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="content_youtube_url">URL YouTube</Label>
            <Input
              id="content_youtube_url"
              name="content_youtube_url"
              placeholder="https://www.youtube.com/watch?v=..."
              defaultValue={initialValues?.youtube_url}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content_video_url">Ou URL vidéo directe</Label>
            <Input
              id="content_video_url"
              name="content_video_url"
              placeholder="https://..."
              defaultValue={initialValues?.video_url}
            />
          </div>
        </>
      );
    case "pdf":
    case "file":
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="content_file_url">URL du fichier</Label>
            <Input
              id="content_file_url"
              name="content_file_url"
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              required
            />
            <FileUploadField
              bucket="lesson-files"
              accept={type === "pdf" ? "application/pdf" : undefined}
              onUploaded={(url, uploadedName) => {
                setFileUrl(url);
                if (!fileName) setFileName(uploadedName);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content_file_name">Nom du fichier</Label>
            <Input
              id="content_file_name"
              name="content_file_name"
              placeholder="ex. cours-reseaux.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
            />
          </div>
        </>
      );
  }
}
