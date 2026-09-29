"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "./file-upload-field";
import { deleteFile, type Bucket, type StorageFile } from "@/actions/files";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function BucketSection({
  bucket,
  label,
  initialFiles,
}: {
  bucket: Bucket;
  label: string;
  initialFiles: StorageFile[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{label}</h2>
        <FileUploadField
          bucket={bucket}
          onUploaded={(url, fileName) => {
            setFiles((prev) => [
              { name: fileName, url, size: 0, createdAt: new Date().toISOString() },
              ...prev,
            ]);
          }}
        />
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun fichier.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-primary underline underline-offset-4"
              >
                {file.name}
              </a>
              {file.size > 0 ? (
                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
              ) : null}
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer "${file.name}" ?`)) {
                    setFiles((prev) => prev.filter((f) => f.name !== file.name));
                    startTransition(() => deleteFile(bucket, file.name));
                  }
                }}
              >
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FilesManager({
  lessonImages,
  lessonFiles,
  documents,
}: {
  lessonImages: StorageFile[];
  lessonFiles: StorageFile[];
  documents: StorageFile[];
}) {
  return (
    <div className="space-y-6">
      <BucketSection bucket="lesson-images" label="Images" initialFiles={lessonImages} />
      <BucketSection bucket="lesson-files" label="Fichiers de cours (PDF, Word, PowerPoint)" initialFiles={lessonFiles} />
      <BucketSection bucket="documents" label="Documents" initialFiles={documents} />
    </div>
  );
}
