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
import { SequenceDialog } from "./sequence-dialog";
import { toggleSequencePublished, deleteSequence } from "@/actions/sequences";

export type SequenceRow = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
};

export function SequencesTable({
  sequences,
  unitId,
  unitLevelId,
}: {
  sequences: SequenceRow[];
  unitId: string;
  unitLevelId: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (sequences.length === 0) {
    return <p className="text-muted-foreground">Aucune séquence pour cette unité.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Ordre</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sequences.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>{row.order_index}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() =>
                      toggleSequencePublished(row.id, unitId, unitLevelId, checked)
                    )
                  }
                />
                <Badge variant={row.is_published ? "default" : "secondary"}>
                  {row.is_published ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/admin/sessions?sequence=${row.id}`} />}
              >
                Séances →
              </Button>
              <SequenceDialog
                mode="edit"
                unitId={unitId}
                unitLevelId={unitLevelId}
                initialValues={{
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  orderIndex: row.order_index,
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
                  if (confirm(`Supprimer la séquence "${row.title}" ?`)) {
                    startTransition(() => deleteSequence(row.id, unitId, unitLevelId));
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
