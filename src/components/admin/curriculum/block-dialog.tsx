"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createBlock, updateBlock, createInlineExercise } from "@/actions/lesson-blocks";
import { BLOCK_TYPE_LABELS, type BlockType } from "@/schemas/lesson-blocks";
import type { BlockRow, ExerciseOption } from "./session-blocks-editor";
import { InteractiveEditor } from "./interactive-editor";
import Link from "next/link";

type Props = {
  trigger: React.ReactElement<{ children?: React.ReactNode }>;
  mode: "create" | "edit";
  sessionId: string;
  exercises: ExerciseOption[];
  initialType?: BlockType;
  initialBlock?: BlockRow;
};

export function BlockDialog({ trigger, mode, sessionId, exercises, initialType, initialBlock }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const type: BlockType = (initialBlock?.type ?? initialType ?? "text") as BlockType;
  const [title, setTitle] = useState(initialBlock?.title ?? "");

  // Per-type content state (only the fields for the active type get used)
  const [markdown, setMarkdown] = useState(String(initialBlock?.content.markdown ?? ""));
  const [imageUrl, setImageUrl] = useState(String(initialBlock?.content.url ?? ""));
  const [imageCaption, setImageCaption] = useState(String(initialBlock?.content.caption ?? ""));
  const [youtubeUrl, setYoutubeUrl] = useState(String(initialBlock?.content.youtube_url ?? ""));
  const [videoUrl, setVideoUrl] = useState(String(initialBlock?.content.video_url ?? ""));
  const [fileUrl, setFileUrl] = useState(String(initialBlock?.content.url ?? ""));
  const [fileName, setFileName] = useState(String(initialBlock?.content.file_name ?? ""));
  const [exerciseId, setExerciseId] = useState(String(initialBlock?.content.exercise_id ?? ""));
  const [html, setHtml] = useState(String(initialBlock?.content.html ?? ""));
  const [css, setCss] = useState(String(initialBlock?.content.css ?? ""));
  const [js, setJs] = useState(String(initialBlock?.content.js ?? ""));

  // Inline exercise creation
  const [newExerciseTitle, setNewExerciseTitle] = useState("");

  function buildContent() {
    switch (type) {
      case "text":
        return { markdown };
      case "image":
        return { url: imageUrl, caption: imageCaption };
      case "video":
        return { youtube_url: youtubeUrl, video_url: videoUrl };
      case "file":
        return { url: fileUrl, file_name: fileName };
      case "exercise":
        return { exercise_id: exerciseId };
      case "interactive":
        return { html, css, js };
    }
  }

  async function handleCreateInlineExercise() {
    setIsPending(true);
    const result = await createInlineExercise(sessionId, newExerciseTitle);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.id) {
      setExerciseId(result.id);
      setNewExerciseTitle("");
    }
  }

  async function handleSave() {
    setIsPending(true);
    setError(null);
    const content = buildContent();
    const result =
      mode === "edit" && initialBlock
        ? await updateBlock(initialBlock.id, sessionId, type, title, content)
        : await createBlock(sessionId, type, title, content);
    setIsPending(false);
    if (result?.error) setError(result.error);
    else setOpen(false);
  }

  const needsBigDialog = type === "interactive" || type === "exercise" || type === "text";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setFormKey((k) => k + 1);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className={needsBigDialog ? "max-w-3xl" : "max-w-xl"}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nouveau bloc" : "Modifier le bloc"} —{" "}
            <span className="font-normal text-muted-foreground">{BLOCK_TYPE_LABELS[type]}</span>
          </DialogTitle>
        </DialogHeader>
        <div key={formKey} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du bloc (optionnel)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {type === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="markdown">Texte (Markdown)</Label>
              <Textarea
                id="markdown"
                rows={12}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="font-mono text-xs"
                placeholder="# Titre&#10;&#10;Un paragraphe.&#10;&#10;- Point 1&#10;- Point 2"
              />
              <p className="text-[11px] text-muted-foreground">
                Markdown : <code>#</code> titre, <code>**gras**</code>, <code>*italique*</code>, listes <code>-</code>, liens <code>[texte](url)</code>, images <code>![alt](url)</code>.
              </p>
            </div>
          ) : null}

          {type === "image" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de l&apos;image</Label>
                <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageCaption">Légende (optionnel)</Label>
                <Input id="imageCaption" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} />
              </div>
            </>
          ) : null}

          {type === "video" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">URL YouTube</Label>
                <Input
                  id="youtubeUrl"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">— OU —</p>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">URL vidéo directe (.mp4)</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://…/video.mp4"
                />
              </div>
            </>
          ) : null}

          {type === "file" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fileUrl">URL du fichier</Label>
                <Input id="fileUrl" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…/cours.pdf" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileName">Nom affiché (optionnel)</Label>
                <Input id="fileName" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="ex. Cours sur les réseaux" />
              </div>
            </>
          ) : null}

          {type === "exercise" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseId">Choisir un exercice</Label>
                <Select id="exerciseId" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                  <option value="">—</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </Select>
                {exerciseId ? (
                  <Link
                    href={`/admin/curriculum/sessions/${sessionId}/exercises/${exerciseId}`}
                    className="inline-flex text-xs font-medium text-primary hover:underline"
                  >
                    Éditer les questions de cet exercice →
                  </Link>
                ) : null}
              </div>
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ou créer un nouvel exercice
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newExerciseTitle}
                    onChange={(e) => setNewExerciseTitle(e.target.value)}
                    placeholder="Titre du nouvel exercice"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || !newExerciseTitle.trim()}
                    onClick={handleCreateInlineExercise}
                  >
                    Créer
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Après création, l&apos;exercice sera sélectionné. Les questions se définissent sur
                  la page d&apos;édition.
                </p>
              </div>
            </div>
          ) : null}

          {type === "interactive" ? (
            <InteractiveEditor html={html} css={css} js={js} onChange={(v) => { setHtml(v.html); setCss(v.css); setJs(v.js); }} />
          ) : null}

          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Ajouter" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
