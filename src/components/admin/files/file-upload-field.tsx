"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadFile, type Bucket } from "@/actions/files";

export function FileUploadField({
  bucket,
  onUploaded,
  accept,
}: {
  bucket: Bucket;
  onUploaded: (url: string, fileName: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadFile(bucket, formData);

    setIsUploading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.url) {
      onUploaded(result.url, file.name);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Téléversement..." : "Téléverser un fichier"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
