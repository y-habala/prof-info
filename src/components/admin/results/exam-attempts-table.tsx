"use client";
import { useTransition } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteExamAttempt } from "@/actions/exam-results";

export type AttemptRow = {
  id: string;
  model_label: string;
  student_name: string;
  student_first_name: string;
  student_number: string | null;
  student_class: string | null;
  score20: number | null;
  started_at: string;
  submitted_at: string | null;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExamAttemptsTable({ examId, attempts }: { examId: string; attempts: AttemptRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
        Aucune tentative pour les filtres actuels.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Élève</TableHead>
          <TableHead>N°</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Modèle</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Soumis</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attempts.map((row) => {
          const passing = row.score20 !== null && row.score20 >= 10;
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {row.student_first_name} {row.student_name}
              </TableCell>
              <TableCell className="text-muted-foreground">{row.student_number ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{row.student_class ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono uppercase">{row.model_label}</Badge>
              </TableCell>
              <TableCell>
                {row.score20 !== null ? (
                  <span
                    className={cn(
                      "font-mono font-bold",
                      passing ? "text-success" : "text-destructive"
                    )}
                  >
                    {row.score20.toFixed(2)}
                    <span className="font-normal text-muted-foreground">/20</span>
                  </span>
                ) : (
                  <Badge variant="outline">Non soumis</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(row.submitted_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {row.submitted_at ? (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a
                        href={`/api/admin/exams/attempts/${row.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="size-3.5" />
                        PDF
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Supprimer la tentative de ${row.student_first_name} ${row.student_name} ?`)) {
                        startTransition(() => deleteExamAttempt(row.id, examId));
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
