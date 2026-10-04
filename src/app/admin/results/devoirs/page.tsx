import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DEVOIR_SESSIONS, DEVOIR_SESSION_LABELS, type DevoirSession } from "@/schemas/devoirs";

export const metadata: Metadata = {
  title: "Rapport de devoir — Administration",
};

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type DevoirOption = {
  id: string;
  title: string;
  session: DevoirSession;
  level_id: string;
  level_name: string;
};

export default async function DevoirReportSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; session?: string; devoir?: string; class?: string }>;
}) {
  const { level: levelFilter, session: sessionFilter, devoir: devoirId, class: classFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: levels }, { data: devoirsData }] = await Promise.all([
    supabase.from("levels").select("id, name").eq("is_active", true).order("order_index"),
    supabase
      .from("devoirs")
      .select("id, title, session, level_id, levels(name)")
      .order("created_at", { ascending: false }),
  ]);

  const devoirs: DevoirOption[] = (devoirsData ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    session: d.session,
    level_id: d.level_id,
    level_name: (d.levels as unknown as { name: string } | null)?.name ?? "—",
  }));

  const filteredDevoirs = devoirs.filter(
    (d) => (!levelFilter || d.level_id === levelFilter) && (!sessionFilter || d.session === sessionFilter)
  );

  const selectedDevoir = devoirId ? devoirs.find((d) => d.id === devoirId) : undefined;

  let classRows: { className: string; count: number; average: number; successRate: number }[] = [];
  if (selectedDevoir) {
    const { data: exams } = await supabase.from("exams").select("id").eq("devoir_id", selectedDevoir.id);
    const examIds = (exams ?? []).map((e) => e.id);

    if (examIds.length > 0) {
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("student_class, percentage")
        .in("exam_id", examIds)
        .not("submitted_at", "is", null);

      const byClass = new Map<string, number[]>();
      for (const a of attempts ?? []) {
        const key = a.student_class ?? "Non classé";
        if (!byClass.has(key)) byClass.set(key, []);
        if (a.percentage !== null) byClass.get(key)!.push(a.percentage);
      }

      classRows = Array.from(byClass.entries())
        .map(([className, percentages]) => ({
          className,
          count: percentages.length,
          average:
            percentages.length > 0
              ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length / 100) * 20 * 100) / 100
              : 0,
          successRate:
            percentages.length > 0
              ? Math.round((percentages.filter((p) => p >= 50).length / percentages.length) * 1000) / 10
              : 0,
        }))
        .sort((a, b) => a.className.localeCompare(b.className));
    }
  }

  // Only meaningful once a real class name from *this* devoir's own data is
  // picked — a stale `class` param left over from switching to a different
  // devoir (whose classes differ) must fall back to the full table, not
  // silently show a focused view for a class that isn't actually in it.
  const selectedClassRow = classFilter ? classRows.find((row) => row.className === classFilter) : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rapport de devoir</h1>

      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="level" className="text-sm text-muted-foreground">
                Niveau
              </label>
              <select id="level" name="level" defaultValue={levelFilter ?? ""} className={selectClass}>
                <option value="">Tous</option>
                {(levels ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="session" className="text-sm text-muted-foreground">
                Session
              </label>
              <select id="session" name="session" defaultValue={sessionFilter ?? ""} className={selectClass}>
                <option value="">Toutes</option>
                {DEVOIR_SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {DEVOIR_SESSION_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="devoir" className="text-sm text-muted-foreground">
                Contrôle continu
              </label>
              <select id="devoir" name="devoir" defaultValue={devoirId ?? ""} className={selectClass}>
                <option value="">—</option>
                {filteredDevoirs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.level_name} — {d.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="class" className="text-sm text-muted-foreground">
                Classe
              </label>
              <select
                id="class"
                name="class"
                defaultValue={classFilter ?? ""}
                disabled={!selectedDevoir}
                className={selectClass}
              >
                <option value="">Toutes les classes</option>
                {classRows.map((row) => (
                  <option key={row.className} value={row.className}>
                    {row.className}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Résultats</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDevoir ? (
            <p className="text-muted-foreground">Choisissez un devoir puis cliquez sur Chercher.</p>
          ) : classRows.length === 0 ? (
            <p className="text-muted-foreground">Aucune tentative soumise pour ce devoir.</p>
          ) : selectedClassRow ? (
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-border p-4">
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">Classe</p>
                  <p className="font-semibold">{selectedClassRow.className}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Effectif</p>
                  <p className="font-semibold">{selectedClassRow.count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Moyenne</p>
                  <p className="font-semibold">{selectedClassRow.average.toFixed(2)} / 20</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taux de réussite</p>
                  <p className="font-semibold">{selectedClassRow.successRate} %</p>
                </div>
              </div>
              <Button
                nativeButton={false}
                render={
                  <a
                    href={`/api/admin/devoirs/${selectedDevoir.id}/report?class=${encodeURIComponent(selectedClassRow.className)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Télécharger le rapport PDF
              </Button>
            </div>
          ) : (
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
                    <TableCell>{row.successRate} %</TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/api/admin/devoirs/${selectedDevoir.id}/report?class=${encodeURIComponent(row.className)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4"
                      >
                        Télécharger PDF
                      </a>
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
