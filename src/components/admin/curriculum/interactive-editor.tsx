"use client";
import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { SandboxedActivity } from "@/components/student/sandboxed-activity";
import { Button } from "@/components/ui/button";
import { Code2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type InteractiveEditorHandle = {
  getValues(): { html: string };
};

// Single-file editor: the admin writes one complete HTML document (with
// <style> and <script> tags inside) instead of three separate panels.
export const InteractiveEditor = forwardRef<
  InteractiveEditorHandle,
  { initialHtml: string }
>(function InteractiveEditor({ initialHtml }, ref) {
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [html, setHtml] = useState(initialHtml);
  const valRef = useRef(initialHtml);

  useImperativeHandle(ref, () => ({
    getValues: () => ({ html: valRef.current }),
  }));

  function handleChange(v: string) {
    valRef.current = v;
    setHtml(v);
  }

  return (
    <div className="space-y-3">
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
