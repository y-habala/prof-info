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
import { toggleHtmlPagePublished, deleteHtmlPage } from "@/actions/html-pages";

export type HtmlPageRow = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
};

export function HtmlPagesTable({ pages }: { pages: HtmlPageRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (pages.length === 0) {
    return <p className="text-muted-foreground">Aucune activité pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell className="font-mono text-xs">{row.slug}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleHtmlPagePublished(row.id, checked))
                  }
                />
                <Badge variant={row.is_published ? "default" : "secondary"}>
                  {row.is_published ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
              {row.is_published ? (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/activities/${row.slug}`} target="_blank" />}
                >
                  Aperçu →
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/admin/html-pages/${row.id}`} />}
              >
                Modifier
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer l'activité "${row.title}" ?`)) {
                    startTransition(() => deleteHtmlPage(row.id));
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
