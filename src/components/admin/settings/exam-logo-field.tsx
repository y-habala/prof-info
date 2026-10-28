"use client";
import { useRef, useState } from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadExamLogo, removeExamLogo } from "@/actions/settings";

export function ExamLogoField({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadExamLogo(fd);
    setPending(false);
    if (result.error) setError(result.error);
    else if (result.url) setUrl(result.url);
  }

  async function onRemove() {
    if (!confirm("Retirer le logo des feuilles d'examen ?")) return;
    setPending(true);
    setError(null);
    const result = await removeExamLogo();
    setPending(false);
    if (result.error) setError(result.error);
    else setUrl("");
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Logo de l&apos;en-tête des examens
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Affiché au centre de l&apos;en-tête des feuilles d&apos;examen (PDF). Image PNG ou JPG,
          2 Mo maximum — idéalement sur fond blanc ou transparent.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-24 w-64 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-white p-2">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Logo de l'en-tête" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">Aucun logo</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="gap-2"
            onClick={() => inputRef.current?.click()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
            {url ? "Remplacer le logo" : "Charger un logo"}
          </Button>
          {url ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              Retirer
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
