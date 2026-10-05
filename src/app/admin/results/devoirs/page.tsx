import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SEMESTER_LABELS, type Semester } from "@/schemas/exams";
import { scoreOutOf20 } from "@/lib/grading";

export const metadata: Metadata = {
  title: "Résultats par devoir — Administration",
};

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

type ClassRow = { className: string; count: number; average: number; successRate: number };

export default async function AdminDevoirsResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; semester?: string; devoir?: string }>;
}) {
  const { level: levelId, semester: semesterParam, devoir: devoirParam } = await searchParams;
  const supabase = await createClient();

  const { data: levels } = await supabase.from("levels").select("id, name").order("order_index");

  // Each select narrows the next, computed directly from exams (no separate
  // "devoirs" table) — a devoir is just "however many exam rows share this
  // level + semester + devoir_number," the admin's own multi-modèle rows.
  let semesters: Semester[] = [];
  if (levelId) {
    const { data } = await supabase
      .from("exams")
      .select("semester")
      .eq("level_id", levelId)
      .not("semester", "is", null)
      .not("devoir_number", "is", null);
    semesters = Array.from(new Set((data ?? []).map((d) => d.semester as Semester))).sort();
  }

  let devoirNumbers: number[] = [];
  if (levelId && semesterParam) {
    const { data } = await supabase
      .from("exams")
      .select("devoir_number")
      .eq("level_id", levelId)
      .eq("semester", semesterParam)
      .not("devoir_number", "is", null);
    devoirNumbers = Array.from(new Set((data ?? []).map((d) => d.devoir_number as number))).sort((a, b) => a - b);
  }

  const devoirNumber = devoirParam ? Number(devoirParam) : null;
  let classRows: ClassRow[] = [];
  if (levelId && semesterParam && devoirNumber) {
    const { data: matchingExams } = await supabase
      .from("exams")
      .select("id")
      .eq("level_id", levelId)
      .eq("semester", semesterParam)
      .eq("devoir_number", devoirNumber);
    const examIds = (matchingExams ?? []).map((e) => e.id);

    if (examIds.length > 0) {
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("student_class, score, max_score, submitted_at")
        .in("exam_id", examIds);

      const byClass = new Map<string, number[]>();
      for (const a of attempts ?? []) {
        if (!a.student_class || !a.submitted_at) continue;
        const scores = byClass.get(a.student_class) ?? [];
        scores.push(scoreOutOf20(Number(a.score), Number(a.max_score)));
        byClass.set(a.student_class, scores);
      }
      classRows = Array.from(byClass.entries())
        .map(([className, scores]) => {
          const count = scores.length;
          const passing = scores.filter((s) => s >= 10).length;
          return {
            className,
            count,
            average: count > 0 ? scores.reduce((a, b) => a + b, 0) / count : 0,
            successRate: count > 0 ? (passing / count) * 100 : 0,
          };
        })
        .sort((a, b) => a.className.localeCompare(b.className));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/results" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux résultats
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Résultats par devoir</h1>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="level" className="text-sm text-muted-foreground">
            Niveau
          </label>
          <select id="level" name="level" defaultValue={levelId ?? ""} className={selectClass}>
            <option value="">—</option>
            {(levels ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="semester" className="text-sm text-muted-foreground">
            Semestre
          </label>
          <select
            id="semester"
            name="semester"
            defaultValue={semesterParam ?? ""}
            disabled={!levelId}
            className={selectClass}
          >
            <option value="">—</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                {SEMESTER_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="devoir" className="text-sm text-muted-foreground">
            N° de devoir
          </label>
          <select
            id="devoir"
            name="devoir"
            defaultValue={devoirParam ?? ""}
            disabled={!semesterParam}
            className={selectClass}
          >
            <option value="">—</option>
            {devoirNumbers.map((n) => (
              <option key={n} value={n}>
                Devoir {n}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Chercher
        </button>
      </form>

      {levelId && semesterParam && devoirNumber ? (
        classRows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Effectif</TableHead>
                <TableHead>Moyenne</TableHead>
                <TableHead>Taux de réussite</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classRows.map((row) => (
                <TableRow key={row.className}>
                  <TableCell className="font-medium">{row.className}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{row.average.toFixed(2)} / 20</TableCell>
                  <TableCell>{row.successRate.toFixed(1)} %</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <a
                          href={`/api/admin/devoirs/report?level=${levelId}&semester=${semesterParam}&devoir=${devoirNumber}&class=${encodeURIComponent(row.className)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      Télécharger PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">Aucune tentative trouvée pour ce devoir.</p>
        )
      ) : (
        <p className="text-muted-foreground">Choisissez un niveau, un semestre, puis un numéro de devoir.</p>
      )}
    </div>
  );
}
