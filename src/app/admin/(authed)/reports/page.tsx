import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTROL_LABELS } from "@/lib/massar/cc-constants";
import { mentionOf } from "@/lib/mentions";
import { CcFilters, type SheetOption } from "@/components/admin/controle-continu/cc-filters";

type Search = { annee?: string; niveau?: string; classe?: string; session?: string; controle?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: sheetsData, error } = await supabase
    .from("cc_sheets")
    .select("id, school_year, level_label, class_name, session_code, session_label")
    .order("school_year", { ascending: false })
    .order("class_name")
    .order("session_code");

  const sheets: SheetOption[] = (sheetsData ?? []).map((s) => ({
    id: s.id,
    schoolYear: s.school_year,
    levelLabel: s.level_label,
    className: s.class_name,
    sessionCode: s.session_code,
    sessionLabel: s.session_label,
  }));

  const control = Number(sp.controle);
  const validControl = Number.isInteger(control) && control >= 1 && control <= 4;
  const selected = sheets.find(
    (s) => s.schoolYear === sp.annee && s.className === sp.classe && s.sessionCode === sp.session
  );

  let roster: { name: string; score: number | null; absence: string | null }[] = [];
  if (selected && validControl) {
    const { data } = await supabase
      .from("cc_students")
      .select(`full_name, row_number, note${control}, abs${control}`)
      .eq("sheet_id", selected.id)
      .order("row_number");
    roster = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      name: String(r.full_name),
      score: r[`note${control}`] == null ? null : Number(r[`note${control}`]),
      absence: (r[`abs${control}`] as string | null) ?? null,
    }));
  }

  const scores = roster.flatMap((r) => (r.score == null ? [] : [r.score]));
  const present = scores.length;
  const average = present > 0 ? scores.reduce((a, b) => a + b, 0) / present : null;
  const passing = scores.filter((s) => s >= 10).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rapports de classe établis à partir des notes du contrôle continu : la liste des élèves et les
          absences viennent du fichier Massar.
        </p>
      </div>

      {error ? (
        <Card className="p-6 text-sm text-destructive">Les tables du contrôle continu sont introuvables.</Card>
      ) : (
        <CcFilters
          sheets={sheets}
          current={sp}
          basePath="/admin/reports"
          title="Choisir la classe et le contrôle"
          showEmptyToggle={false}
        />
      )}

      {selected && validControl ? (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div>
              <h2 className="font-semibold">
                {selected.className} · {selected.sessionLabel} · {CONTROL_LABELS[control - 1]}
              </h2>
              <p className="text-xs text-muted-foreground">{selected.schoolYear}</p>
            </div>
            {present > 0 ? (
              <Button asChild className="gap-2">
                <a href={`/api/admin/reports/${selected.id}?control=${control}`}>
                  <FileText className="size-4" />
                  Télécharger le rapport PDF
                </a>
              </Button>
            ) : null}
          </div>

          {present === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Aucune note saisie pour ce contrôle. Saisis ou récupère les notes dans « Contrôle continu »
              avant de générer le rapport.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 border-b border-border p-5 sm:grid-cols-4">
                <Stat label="Moyenne" value={average!.toFixed(2)} />
                <Stat label="Taux de réussite" value={`${((passing / present) * 100).toFixed(1)} %`} />
                <Stat label="Présents" value={String(present)} />
                <Stat label="Absents" value={String(roster.length - present)} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="w-12 px-4 py-2.5">N°</th>
                      <th className="px-4 py-2.5">Nom et prénom</th>
                      <th className="px-4 py-2.5">Note /20</th>
                      <th className="px-4 py-2.5">Mention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((r, i) => {
                      const m = r.score == null ? null : mentionOf(r.score);
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2 font-medium">{r.name}</td>
                          <td className="px-4 py-2 font-semibold">
                            {r.score == null ? <span className="text-muted-foreground">—</span> : r.score.toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: m ? m.color : "#9aa3b2" }}
                            >
                              {m ? m.label : r.absence ? "Abs. justifiée" : "Absent"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
