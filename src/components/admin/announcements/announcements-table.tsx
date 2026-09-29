"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AnnouncementDialog } from "./announcement-dialog";
import { ANNOUNCEMENT_TYPE_LABELS, ANNOUNCEMENT_TYPES } from "@/schemas/announcements";
import { toggleAnnouncementPublished, deleteAnnouncement } from "@/actions/announcements";

export type AnnouncementRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  type: (typeof ANNOUNCEMENT_TYPES)[number];
  is_published: boolean;
  published_at: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function AnnouncementsTable({ announcements }: { announcements: AnnouncementRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (announcements.length === 0) {
    return <p className="text-muted-foreground">Aucune actualité pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Publié le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {announcements.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>
              <Badge variant="secondary">{ANNOUNCEMENT_TYPE_LABELS[row.type]}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleAnnouncementPublished(row.id, checked))
                  }
                />
                <Badge variant={row.is_published ? "default" : "secondary"}>
                  {row.is_published ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </TableCell>
            <TableCell>{formatDate(row.published_at)}</TableCell>
            <TableCell className="text-right space-x-2">
              {row.is_published ? (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/actualites/${row.slug}`} target="_blank" />}
                >
                  Aperçu →
                </Button>
              ) : null}
              <AnnouncementDialog
                mode="edit"
                initialValues={{
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  content: row.content,
                  slug: row.slug,
                  imageUrl: row.image_url,
                  type: row.type,
                }}
                trigger={
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                }
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer "${row.title}" ?`)) {
                    startTransition(() => deleteAnnouncement(row.id));
                  }
                }}
              >
                Supprimer
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
