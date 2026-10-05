"use client";
import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, ArrowRight, Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExamDialog } from "./exam-dialog";
import { toggleExamPublished, toggleExamActive, deleteExam } from "@/actions/exams";

export type ExamRow = {
  id: string;
  title: string;
  level_id: string | null;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  max_attempts: number;
  is_published: boolean;
  is_active: boolean;
  model_count: number;
};

type Level = { id: string; name: string };

export function ExamsTable({ exams, levels }: { exams: ExamRow[]; levels: Level[] }) {
  const [isPending, startTransition] = useTransition();

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
        Aucun examen pour le moment.
      </div>
    );
  }

  const levelNameById = new Map(levels.map((l) => [l.id, l.name]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Niveau</TableHead>
          <TableHead>Modèles</TableHead>
          <TableHead>Durée</TableHead>
          <TableHead>Publié</TableHead>
          <TableHead>Actif</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exams.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell className="text-muted-foreground">
              {row.level_id ? levelNameById.get(row.level_id) ?? "—" : "—"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="gap-1">
                <Layers className="size-3" />
                {row.model_count}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{row.duration_minutes} min</TableCell>
            <TableCell>
              <Switch
                checked={row.is_published}
                disabled={isPending}
                onCheckedChange={(c) => startTransition(() => toggleExamPublished(row.id, c))}
              />
            </TableCell>
            <TableCell>
              <Switch
                checked={row.is_active}
                disabled={isPending}
                onCheckedChange={(c) => startTransition(() => toggleExamActive(row.id, c))}
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link
                  href={`/admin/exams/${row.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Modèles
                  <ArrowRight className="size-3.5" />
                </Link>
                <ExamDialog
                  mode="edit"
                  levels={levels}
                  initialValues={{
                    id: row.id,
                    title: row.title,
                    levelId: row.level_id,
                    durationMinutes: row.duration_minutes,
                    startAt: row.start_at,
                    endAt: row.end_at,
                    maxAttempts: row.max_attempts,
                  }}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Pencil className="size-3.5" />
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Supprimer l'examen "${row.title}" et tous ses modèles ?`)) {
                      startTransition(() => deleteExam(row.id));
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
