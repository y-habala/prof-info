"use client";
import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { SandboxedActivity } from "@/components/student/sandboxed-activity";
import { Button } from "@/components/ui/button";
import { Code2, Eye, FileUp, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type InteractiveEditorHandle = {
  getValues(): { html: string };
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;

// Single-file editor: one complete HTML document (with <style> and <script>
// inside), typed here or imported from a .html file.
export const InteractiveEditor = forwardRef<
  InteractiveEditorHandle,
  { initialHtml: string; preferImport?: boolean }
>(function InteractiveEditor({ initialHtml, preferImport = false }, ref) {
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [html, setHtml] = useState(initialHtml);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const valRef = useRef(initialHtml);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    getValues: () => ({ html: valRef.current }),
  }));

  function handleChange(v: string) {
    valRef.current = v;
    setHtml(v);
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    if (!/\.html?$/i.test(file.name)) {
      setFileError("Choisis un fichier .html ou .htm.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Fichier trop lourd (2 Mo maximum).");
      return;
    }
    handleChange(await file.text());
    setFileName(file.name);
    setTab("preview");
  }

  const showDropZone = preferImport && !html.trim();

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm,text/html"
        className="hidden"
        onChange={(e) => {
          loadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {showDropZone ? (
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
            loadFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <FileUp className="size-8 text-primary" />
          <span className="text-sm font-semibold">Glisse ton fichier .html ici, ou clique pour le choisir</span>
          <span className="text-xs text-muted-foreground">
            Le fichier est importé tel quel (styles et scripts compris) — 2 Mo maximum.
          </span>
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === "code" ? "default" : "ghost"}
            onClick={() => setTab("code")}
            className={cn("gap-1.5", tab === "code" && "shadow-sm")}
          >
            <Code2 className="size-3.5" />
            Code HTML
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "preview" ? "default" : "ghost"}
            onClick={() => setTab("preview")}
            className={cn("gap-1.5", tab === "preview" && "shadow-sm")}
          >
            <Eye className="size-3.5" />
            Aperçu
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="size-3.5" />
          Importer un fichier .html
        </Button>
        {fileName ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <FileCode2 className="size-3.5" />
            {fileName} importé
          </span>
        ) : null}
      </div>

      {fileError ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {fileError}
        </p>
      ) : null}

      {tab === "code" && (
        <>
          <CodeMirror
            value={html}
            onChange={handleChange}
            height="450px"
            extensions={[htmlLang()]}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
          <p className="text-[11px] text-muted-foreground">
            Écris un document HTML complet. Mets tes styles dans{" "}
            <code className="rounded bg-muted px-1">&lt;style&gt;</code> et ton
            JavaScript dans{" "}
            <code className="rounded bg-muted px-1">&lt;script&gt;</code> — tout
            dans le même fichier.
          </p>
        </>
      )}

      {tab === "preview" && (
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Aperçu — sandboxé, sans accès aux cookies ni au reste du site.
          </p>
          <SandboxedActivity html={html} />
        </div>
      )}
    </div>
  );
});
