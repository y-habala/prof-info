"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DevoirDialog } from "./devoir-dialog";
import { deleteDevoir } from "@/actions/devoirs";
import { DEVOIR_SESSION_LABELS, type DevoirSession } from "@/schemas/devoirs";

export type DevoirRow = {
  id: string;
  title: string;
  session: DevoirSession;
  level_id: string;
  level_name: string;
};

export function DevoirsTable({
  devoirs,
  levels,
}: {
  devoirs: DevoirRow[];
  levels: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  if (devoirs.length === 0) {
    return <p className="text-muted-foreground">Aucun devoir pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Niveau</TableHead>
          <TableHead>Session</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devoirs.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.level_name}</TableCell>
            <TableCell>{DEVOIR_SESSION_LABELS[row.session]}</TableCell>
            <TableCell className="text-right space-x-2">
              <DevoirDialog
                mode="edit"
                levels={levels}
                initialValues={{
                  id: row.id,
                  title: row.title,
                  levelId: row.level_id,
                  session: row.session,
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
                  if (confirm(`Supprimer le devoir "${row.title}" ?`)) {
                    startTransition(() => deleteDevoir(row.id));
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
