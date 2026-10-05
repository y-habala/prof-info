"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";
import { createAnnouncement, updateAnnouncement } from "@/actions/announcements";

type AnnouncementDialogProps = {
  trigger: React.ReactNode;
  mode: "create" | "edit";
  initialValues?: {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    slug: string;
    imageUrl: string | null;
  };
};

// A Base UI Dialog does not unmount its content on close, so controlled
// fields (title/slug here, for the auto-slugify) would otherwise leak the
// previous row's values into the next open. Mounting the form only while
// `open` is true forces a fresh instance — and fresh useState — every time.
function AnnouncementForm({
  mode,
  initialValues,
  onDone,
}: Pick<AnnouncementDialogProps, "mode" | "initialValues"> & { onDone: () => void }) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleAction(formData: FormData) {
    setError(null);
    setIsPending(true);
    const result =
      mode === "edit" && initialValues
        ? await updateAnnouncement(initialValues.id, undefined, formData)
        : await createAnnouncement(undefined, formData);
    setIsPending(false);

    if (result?.error) {
      setError(result.error);
    } else {
      onDone();
    }
  }

  return (
    <form action={handleAction} className="space-y-4">
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
      <div className="space-y-2">
        <Label htmlFor="description">Description courte</Label>
        <Input id="description" name="description" defaultValue={initialValues?.description ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image (URL, optionnel)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          placeholder="https://…"
          defaultValue={initialValues?.imageUrl ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Contenu</Label>
        <Textarea id="content" name="content" rows={8} defaultValue={initialValues?.content ?? ""} />
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

export function AnnouncementDialog({ trigger, mode, initialValues }: AnnouncementDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement}>
        {(trigger as React.ReactElement<{ children?: React.ReactNode }>).props.children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouvelle actualité" : "Modifier l'actualité"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <AnnouncementForm mode={mode} initialValues={initialValues} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
