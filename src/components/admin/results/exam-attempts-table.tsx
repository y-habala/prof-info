"use client";

import { useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteExamAttempt } from "@/actions/results";

export type ExamAttemptRow = {
  id: string;
  student_name: string;
  student_first_name: string;
  student_number: string | null;
  student_class: string | null;
  student_code: string | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  started_at: string;
  submitted_at: string | null;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR");
}

export function ExamAttemptsTable({ examId, attempts }: { examId: string; attempts: ExamAttemptRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (attempts.length === 0) {
    return <p className="text-muted-foreground">Aucune tentative pour cet examen.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Élève</TableHead>
          <TableHead>N°</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Soumis le</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attempts.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              {row.student_first_name} {row.student_name}
            </TableCell>
            <TableCell>{row.student_number ?? "—"}</TableCell>
            <TableCell>{row.student_class ?? "—"}</TableCell>
            <TableCell className="font-mono text-xs">{row.student_code ?? "—"}</TableCell>
            <TableCell>
              {row.submitted_at ? `${row.score} / ${row.max_score} (${row.percentage} %)` : "—"}
            </TableCell>
            <TableCell>{row.submitted_at ? "Terminé" : "En cours"}</TableCell>
            <TableCell>{formatDateTime(row.submitted_at)}</TableCell>
            <TableCell className="text-right space-x-2">
              {row.submitted_at ? (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<a href={`/api/exam/${row.id}/pdf`} target="_blank" />}
                >
                  PDF
                </Button>
              ) : null}
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer la tentative de ${row.student_first_name} ${row.student_name} ?`)) {
                    startTransition(() => deleteExamAttempt(row.id, examId));
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
