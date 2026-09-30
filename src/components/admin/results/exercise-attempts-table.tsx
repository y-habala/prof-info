"use client";

import { useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteExerciseAttempt } from "@/actions/results";

export type ExerciseAttemptRow = {
  id: string;
  student_name: string;
  student_first_name: string;
  student_class: string | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  started_at: string;
  completed_at: string | null;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR");
}

export function ExerciseAttemptsTable({
  exerciseId,
  attempts,
}: {
  exerciseId: string;
  attempts: ExerciseAttemptRow[];
}) {
  const [isPending, startTransition] = useTransition();

  if (attempts.length === 0) {
    return <p className="text-muted-foreground">Aucune tentative pour cet exercice.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Élève</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Terminé le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attempts.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              {row.student_first_name} {row.student_name}
            </TableCell>
            <TableCell>{row.student_class ?? "—"}</TableCell>
            <TableCell>
              {row.completed_at ? `${row.score} / ${row.max_score} (${row.percentage} %)` : "—"}
            </TableCell>
            <TableCell>{row.completed_at ? "Terminé" : "En cours"}</TableCell>
            <TableCell>{formatDateTime(row.completed_at)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer la tentative de ${row.student_first_name} ${row.student_name} ?`)) {
                    startTransition(() => deleteExerciseAttempt(row.id, exerciseId));
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
