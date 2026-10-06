"use client";
import { useRef, useState, useTransition, useEffect } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteExamAttempt, deleteExamAttempts } from "@/actions/exam-results";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allIds = attempts.map((a) => a.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = !allSelected && allIds.some((id) => selected.has(id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = [...selected];
    if (!confirm(`Supprimer ${ids.length} tentative(s) ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      await deleteExamAttempts(ids, examId);
      setSelected(new Set());
    });
  }

  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
        Aucune tentative pour les filtres actuels.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-destructive">
              {selected.size} tentative{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() => setSelected(new Set())}
            >
              Désélectionner tout
            </button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            className="gap-1.5"
            onClick={handleBulkDelete}
          >
            <Trash2 className="size-3.5" />
            Supprimer ({selected.size})
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="size-4 cursor-pointer rounded accent-primary"
                aria-label="Tout sélectionner"
              />
            </TableHead>
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
            const isSelected = selected.has(row.id);
            return (
              <TableRow
                key={row.id}
                className={cn(isSelected && "bg-muted/40")}
                onClick={() => toggleRow(row.id)}
                style={{ cursor: "pointer" }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(row.id)}
                    className="size-4 cursor-pointer rounded accent-primary"
                  />
                </TableCell>
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
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}
