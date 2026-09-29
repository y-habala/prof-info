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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SessionDialog } from "./session-dialog";
import { toggleSessionPublished, deleteSession } from "@/actions/sessions";

export type SessionRow = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_published: boolean;
};

export function SessionsTable({
  sessions,
  sequenceId,
  unitId,
  levelId,
}: {
  sessions: SessionRow[];
  sequenceId: string;
  unitId: string;
  levelId: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (sessions.length === 0) {
    return <p className="text-muted-foreground">Aucune séance pour cette séquence.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Durée</TableHead>
          <TableHead>Ordre</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>{row.duration_minutes ? `${row.duration_minutes} min` : "—"}</TableCell>
            <TableCell>{row.order_index}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() =>
                      toggleSessionPublished(row.id, sequenceId, unitId, levelId, checked)
                    )
                  }
                />
                <Badge variant={row.is_published ? "default" : "secondary"}>
                  {row.is_published ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <SessionDialog
                mode="edit"
                sequenceId={sequenceId}
                unitId={unitId}
                levelId={levelId}
                initialValues={{
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  durationMinutes: row.duration_minutes,
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
                  if (confirm(`Supprimer la séance "${row.title}" ?`)) {
                    startTransition(() => deleteSession(row.id, sequenceId, unitId, levelId));
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
