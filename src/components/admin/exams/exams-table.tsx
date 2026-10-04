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
import { ExamDialog } from "./exam-dialog";
import { toggleExamPublished, toggleExamActive, deleteExam } from "@/actions/exams";

export type ExamRow = {
  id: string;
  title: string;
  description: string | null;
  level_id: string | null;
  duration_minutes: number;
  secret_code: string;
  start_at: string | null;
  end_at: string | null;
  max_attempts: number;
  is_published: boolean;
  is_active: boolean;
  question_count: number;
};

type Level = { id: string; name: string };

export function ExamsTable({
  exams,
  levels,
}: {
  exams: ExamRow[];
  levels: Level[];
}) {
  const [isPending, startTransition] = useTransition();

  if (exams.length === 0) {
    return <p className="text-muted-foreground">Aucun examen pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Publié</TableHead>
          <TableHead>Actif</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exams.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>{row.question_count}</TableCell>
            <TableCell className="font-mono">{row.secret_code}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_published}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleExamPublished(row.id, checked))
                  }
                />
                <Badge variant={row.is_published ? "default" : "secondary"}>
                  {row.is_published ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <Switch
                checked={row.is_active}
                disabled={isPending}
                onCheckedChange={(checked) => startTransition(() => toggleExamActive(row.id, checked))}
              />
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/admin/exams/${row.id}`} />}
              >
                Questions →
              </Button>
              <ExamDialog
                mode="edit"
                levels={levels}
                initialValues={{
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  levelId: row.level_id,
                  durationMinutes: row.duration_minutes,
                  secretCode: row.secret_code,
                  startAt: row.start_at,
                  endAt: row.end_at,
                  maxAttempts: row.max_attempts,
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
                  if (confirm(`Supprimer l'examen "${row.title}" ?`)) {
                    startTransition(() => deleteExam(row.id));
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
