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
import { ExerciseDialog } from "./exercise-dialog";
import type { CurriculumTree } from "./curriculum-selector";
import {
  toggleExercisePublished,
  deleteExercise,
  duplicateExercise,
} from "@/actions/exercises";

export type ExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  level_id: string | null;
  unit_id: string | null;
  sequence_id: string | null;
  session_id: string | null;
  duration_minutes: number | null;
  is_published: boolean;
  question_count: number;
};

export function ExercisesTable({
  exercises,
  tree,
}: {
  exercises: ExerciseRow[];
  tree: CurriculumTree;
}) {
  const [isPending, startTransition] = useTransition();

  if (exercises.length === 0) {
    return <p className="text-muted-foreground">Aucun exercice pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>{row.question_count}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleExercisePublished(row.id, checked))
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
                render={<Link href={`/admin/exercises/${row.id}`} />}
              >
                Questions →
              </Button>
              <ExerciseDialog
                mode="edit"
                tree={tree}
                initialValues={{
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  levelId: row.level_id,
                  unitId: row.unit_id,
                  sequenceId: row.sequence_id,
                  sessionId: row.session_id,
                  durationMinutes: row.duration_minutes,
                }}
                trigger={
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => startTransition(() => duplicateExercise(row.id))}
              >
                Dupliquer
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer l'exercice "${row.title}" ?`)) {
                    startTransition(() => deleteExercise(row.id));
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
