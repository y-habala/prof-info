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
import { LevelDialog } from "./level-dialog";
import { toggleLevelActive, deleteLevel } from "@/actions/levels";

export type LevelRow = {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
};

export function LevelsTable({ levels }: { levels: LevelRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (levels.length === 0) {
    return <p className="text-muted-foreground">Aucun niveau pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Ordre</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {levels.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.description ?? "—"}</TableCell>
            <TableCell>{row.order_index}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_active}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleLevelActive(row.id, checked))
                  }
                />
                <Badge variant={row.is_active ? "default" : "secondary"}>
                  {row.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/admin/sessions?level=${row.id}`} />}
              >
                Gérer →
              </Button>
              <LevelDialog
                mode="edit"
                initialValues={{
                  id: row.id,
                  name: row.name,
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
                  if (confirm(`Supprimer le niveau "${row.name}" ?`)) {
                    startTransition(() => deleteLevel(row.id));
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
