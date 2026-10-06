"use client";
import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, ArrowRight, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseDialog } from "./exercise-dialog";
import { toggleExercisePublished, deleteExercise } from "@/actions/exercises";

export type ExerciseRow = {
  id: string;
  title: string;
  level_id: string | null;
  order_index: number;
  is_published: boolean;
  question_count: number;
};

type Level = { id: string; name: string };

export function ExercisesTable({ exercises, levels }: { exercises: ExerciseRow[]; levels: Level[] }) {
  const [isPending, startTransition] = useTransition();

  if (exercises.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
        Aucun exercice pour le moment.
      </div>
    );
  }
  const nameById = new Map(levels.map((l) => [l.id, l.name]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Niveau</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Publié</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell className="text-muted-foreground">
              {row.level_id ? nameById.get(row.level_id) ?? "—" : "—"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="gap-1">
                <FileText className="size-3" />
                {row.question_count}
              </Badge>
            </TableCell>
            <TableCell>
              <Switch
                checked={row.is_published}
                disabled={isPending}
                onCheckedChange={(c) => startTransition(() => toggleExercisePublished(row.id, c))}
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link
                  href={`/admin/exercises/${row.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Questions
                  <ArrowRight className="size-3.5" />
                </Link>
                <ExerciseDialog
                  mode="edit"
                  levels={levels}
                  initialValues={{
                    id: row.id,
                    title: row.title,
                    levelId: row.level_id,
                    orderIndex: row.order_index,
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
                    if (confirm(`Supprimer l'exercice "${row.title}" et toutes ses questions ?`)) {
                      startTransition(() => deleteExercise(row.id));
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
