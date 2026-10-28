"use client";
import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Upload, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { importCcFiles, type ImportResult } from "@/actions/controle-continu";
import { cn } from "@/lib/utils";

export function CcImport() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const picked = [...list].filter((f) => /\.xlsx$/i.test(f.name));
    setFiles((prev) => [...prev, ...picked.filter((f) => !prev.some((p) => p.name === f.name))]);
  }

  async function onImport() {
    if (files.length === 0) return;
    setPending(true);
    setError(null);
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const res = await importCcFiles(fd);
    setPending(false);
    if (res.error) setError(res.error);
    setResults(res.results);
    setFiles([]);
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Import de données</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Fichiers « export_notesCC_….xlsx » téléchargés depuis Massar (Export et Import Note). Tu peux
          en déposer plusieurs à la fois ; réimporter une classe met à jour sa liste d&apos;élèves.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <Upload className="size-7 text-primary" />
        <span className="text-sm font-medium">Dépose les fichiers ici, ou clique pour les choisir</span>
      </button>

      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <FileSpreadsheet className="size-4 shrink-0 text-success" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <button
                type="button"
                aria-label={`Retirer ${f.name}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setFiles((prev) => prev.filter((p) => p !== f))}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Ajouter
        </Button>
        <Button type="button" onClick={onImport} disabled={pending || files.length === 0} className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Importer {files.length > 0 ? `(${files.length})` : ""}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="space-y-1.5">
          {results.map((r) => (
            <li
              key={r.fileName}
              className={cn(
                "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                r.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {r.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
              <span>
                <strong>{r.fileName}</strong> — {r.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
