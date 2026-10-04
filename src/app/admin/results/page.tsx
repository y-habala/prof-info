import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Résultats — Administration",
};

type AttemptSummary = { count: number; avgPercentage: number | null };

function summarize(percentages: (number | null)[]): AttemptSummary {
  const scored = percentages.filter((p): p is number => p !== null);
  return {
    count: percentages.length,
    avgPercentage: scored.length > 0 ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null,
  };
}

export default async function AdminResultsPage() {
  const supabase = await createClient();

  const [{ data: exams }, { data: examAttempts }] = await Promise.all([
    supabase.from("exams").select("id, title").order("created_at", { ascending: false }),
    supabase.from("exam_attempts").select("exam_id, percentage"),
  ]);

  const examRows = (exams ?? []).map((exam) => ({
    id: exam.id,
    title: exam.title,
    ...summarize((examAttempts ?? []).filter((a) => a.exam_id === exam.id).map((a) => a.percentage)),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Résultats</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Examens</CardTitle>
        </CardHeader>
        <CardContent>
          {examRows.length === 0 ? (
            <p className="text-muted-foreground">Aucun examen pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Tentatives</TableHead>
                  <TableHead>Moyenne</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.avgPercentage !== null ? `${row.avgPercentage} %` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/results/exams/${row.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Voir les résultats →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
