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
import { UnitDialog } from "./unit-dialog";
import { toggleUnitPublished, deleteUnit } from "@/actions/units";

export type UnitRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  order_index: number;
  is_published: boolean;
};

export function UnitsTable({ units, levelId }: { units: UnitRow[]; levelId: string }) {
  const [isPending, startTransition] = useTransition();

  if (units.length === 0) {
    return <p className="text-muted-foreground">Aucune unité pour ce niveau.</p>;
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
        {units.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>{row.order_index}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleUnitPublished(row.id, levelId, checked))
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
                render={<Link href={`/admin/sequences?unit=${row.id}`} />}
              >
                Séquences →
              </Button>
              <UnitDialog
                mode="edit"
                levelId={levelId}
                initialValues={{
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  imageUrl: row.image_url,
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
                  if (confirm(`Supprimer l'unité "${row.title}" ?`)) {
                    startTransition(() => deleteUnit(row.id, levelId));
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
