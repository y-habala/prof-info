"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurriculumSelector, type CurriculumTree } from "@/components/admin/exercises/curriculum-selector";
import { SandboxedActivity } from "@/components/activities/sandboxed-activity";
import { slugify } from "@/lib/slugify";
import { createHtmlPage, updateHtmlPage } from "@/actions/html-pages";

type Tab = "html" | "css" | "js" | "preview";

type HtmlPageEditorProps = {
  mode: "create" | "edit";
  tree: CurriculumTree;
  initialValues?: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    levelId: string | null;
    unitId: string | null;
    sequenceId: string | null;
    sessionId: string | null;
    htmlContent: string;
    cssContent: string;
    javascriptContent: string;
  };
};

export function HtmlPageEditor({ mode, tree, initialValues }: HtmlPageEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("html");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [htmlContent, setHtmlContent] = useState(initialValues?.htmlContent ?? "");
  const [cssContent, setCssContent] = useState(initialValues?.cssContent ?? "");
  const [jsContent, setJsContent] = useState(initialValues?.javascriptContent ?? "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsPending(true);
    formData.set("htmlContent", htmlContent);
    formData.set("cssContent", cssContent);
    formData.set("javascriptContent", jsContent);

    const result =
      mode === "edit" && initialValues
        ? await updateHtmlPage(initialValues.id, undefined, formData)
        : await createHtmlPage(undefined, formData);

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
    } else if (mode === "create" && result && "id" in result && result.id) {
      router.push(`/admin/html-pages/${result.id}`);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={initialValues?.description ?? ""} />
      </div>
      <CurriculumSelector
        tree={tree}
        initialValues={{
          levelId: initialValues?.levelId ?? "",
          unitId: initialValues?.unitId ?? "",
          sequenceId: initialValues?.sequenceId ?? "",
          sessionId: initialValues?.sessionId ?? "",
        }}
      />

      <div className="flex gap-1 border-b">
        {(["html", "css", "js", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t
                ? "border-b-2 border-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "html" ? "HTML" : t === "css" ? "CSS" : t === "js" ? "JavaScript" : "Aperçu"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border">
        {tab === "html" ? (
          <CodeMirror
            value={htmlContent}
            height="400px"
            extensions={[html()]}
            onChange={(value) => setHtmlContent(value)}
          />
        ) : null}
        {tab === "css" ? (
          <CodeMirror
            value={cssContent}
            height="400px"
            extensions={[css()]}
            onChange={(value) => setCssContent(value)}
          />
        ) : null}
        {tab === "js" ? (
          <CodeMirror
            value={jsContent}
            height="400px"
            extensions={[javascript()]}
            onChange={(value) => setJsContent(value)}
          />
        ) : null}
        {tab === "preview" ? (
          <SandboxedActivity html={htmlContent} css={cssContent} javascript={jsContent} />
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
      </Button>
    </form>
  );
}
