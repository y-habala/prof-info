"use client";
import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Copy,
  Check,
  Trash2,
  File,
  FileImage,
  FileVideo,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listFiles, uploadFile, deleteFile } from "@/actions/file-manager";
import type { FileItem } from "@/actions/file-manager";
import { cn } from "@/lib/utils";

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime === "application/pdf" || mime.includes("document") || mime.includes("presentation"))
    return FileText;
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    listFiles().then(({ files: f, error }) => {
      if (!alive) return;
      setLoadError(error ?? null);
      setFiles(f);
      setIsLoading(false);
    });
    return () => { alive = false; };
  }, [refreshKey]);

  async function handleUpload(file: File) {
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const result = await uploadFile(fd);
      if (result.error) {
        setUploadError(result.error);
      } else {
        reload();
      }
    });
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function copyUrl(item: FileItem) {
    navigator.clipboard.writeText(item.publicUrl).catch(() => {});
    setCopiedPath(item.path);
    setTimeout(() => setCopiedPath(null), 2000);
  }

  function remove(item: FileItem) {
    if (!confirm(`Supprimer "${item.name}" ?`)) return;
    startTransition(async () => {
      const result = await deleteFile(item.path);
      if (result.error) setLoadError(result.error);
      else reload();
    });
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        {isPending ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : (
          <Upload className="size-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">
          {isPending ? "Envoi en cours…" : "Cliquer ou glisser un fichier ici"}
        </p>
        <p className="text-xs text-muted-foreground">
          Images · Vidéos · PDF · Documents — max 20 Mo
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          onChange={onFileInput}
        />
      </div>

      {uploadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadError}
        </p>
      ) : null}

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">
          {isLoading ? "Chargement…" : `${files.length} fichier${files.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={reload}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {/* File grid */}
      {!isLoading && files.length === 0 && !loadError ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center text-sm text-muted-foreground">
          Aucun fichier. Commence par en envoyer un ci-dessus.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((item) => {
            const Icon = fileIcon(item.mimeType);
            const isImage = item.mimeType.startsWith("image/");
            const isCopied = copiedPath === item.path;
            return (
              <Card key={item.path} className="group overflow-hidden p-0">
                {/* Preview strip */}
                {isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.publicUrl}
                    alt={item.name}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-muted/30">
                    <Icon className="size-10 text-muted-foreground/60" />
                  </div>
                )}

                {/* Info + actions */}
                <div className="p-3 space-y-2">
                  <p
                    className="truncate text-sm font-medium leading-snug"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(item.size)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={isCopied ? "default" : "outline"}
                      onClick={() => copyUrl(item)}
                      className={cn(
                        "flex-1 gap-1.5 text-xs",
                        isCopied && "bg-success hover:bg-success text-white border-success"
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3.5" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          Copier le lien
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => remove(item)}
                      className="shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
