"use client";
import { useState, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { javascript as jsLang } from "@codemirror/lang-javascript";
import { Button } from "@/components/ui/button";
import { SandboxedActivity } from "@/components/student/sandboxed-activity";
import { Code2, FileCode, FileCode2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "html" | "css" | "js" | "preview";

export type InteractiveEditorHandle = {
  getValues(): { html: string; css: string; js: string };
};

// Fully self-contained: owns html/css/js state so CodeMirror never receives
// an externally-changed value prop (which would trigger an internal dispatch
// that interferes with the user's edits). The parent reads current values via
// the imperative handle instead of lifting state on every keystroke.
export const InteractiveEditor = forwardRef<
  InteractiveEditorHandle,
  { initialHtml: string; initialCss: string; initialJs: string }
>(function InteractiveEditor({ initialHtml, initialCss, initialJs }, ref) {
  const [tab, setTab] = useState<Tab>("html");
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);

  // Ref mirror so getValues() is always fresh without needing a closure over state.
  const vals = useRef({ html: initialHtml, css: initialCss, js: initialJs });

  useImperativeHandle(ref, () => ({
    getValues: () => vals.current,
  }));

  function set(field: "html" | "css" | "js", value: string) {
    vals.current = { ...vals.current, [field]: value };
    if (field === "html") setHtml(value);
    else if (field === "css") setCss(value);
    else setJs(value);
  }

  const extensions = useMemo(() => {
    if (tab === "html") return [htmlLang()];
    if (tab === "css") return [cssLang()];
    if (tab === "js") return [jsLang()];
    return [];
  }, [tab]);

  const TABS: { id: Tab; label: string; icon: typeof Code2 }[] = [
    { id: "html", label: "HTML", icon: FileCode },
    { id: "css", label: "CSS", icon: FileCode2 },
    { id: "js", label: "JavaScript", icon: Code2 },
    { id: "preview", label: "Aperçu", icon: Eye },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={tab === t.id ? "default" : "ghost"}
              onClick={() => setTab(t.id)}
              className={cn("gap-1.5", tab === t.id ? "shadow-sm" : "")}
            >
              <Icon className="size-3.5" />
              {t.label}
            </Button>
          );
        })}
      </div>

      {tab === "html" && (
        <CodeMirror
          value={html}
          onChange={(v) => set("html", v)}
          height="400px"
          extensions={extensions}
          basicSetup={{ lineNumbers: true, foldGutter: true }}
        />
      )}
      {tab === "css" && (
        <CodeMirror
          value={css}
          onChange={(v) => set("css", v)}
          height="400px"
          extensions={extensions}
          basicSetup={{ lineNumbers: true }}
        />
      )}
      {tab === "js" && (
        <CodeMirror
          value={js}
          onChange={(v) => set("js", v)}
          height="400px"
          extensions={extensions}
          basicSetup={{ lineNumbers: true }}
        />
      )}
      {tab === "preview" && (
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Aperçu — sandboxé, ne peut rien lire des cookies ou du reste du site.
          </p>
          <SandboxedActivity html={html} css={css} js={js} />
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        L&apos;activité tourne dans une <strong>iframe isolée</strong> — aucun accès aux cookies de
        la plateforme, aux autres onglets, ni au DOM parent.
      </p>
    </div>
  );
});
