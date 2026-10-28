import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CONTROL_LABELS } from "@/lib/massar/cc-constants";
import { CcImport } from "@/components/admin/controle-continu/cc-import";
import { CcFilters, type SheetOption } from "@/components/admin/controle-continu/cc-filters";
import { CcGradeTable, type GradeRow, type ExamOption } from "@/components/admin/controle-continu/cc-grade-table";
import { CcExport } from "@/components/admin/controle-continu/cc-export";
import { CcSheetList, type SheetSummary } from "@/components/admin/controle-continu/cc-sheet-list";

type Search = {
  annee?: string;
  niveau?: string;
  classe?: string;
  session?: string;
  controle?: string;
  vide?: string;
};

type StudentRow = {
  id: string;
  sheet_id: string;
  row_number: number;
  student_code: string;
  full_name: string;
  note1: number | null;
  note2: number | null;
  note3: number | null;
  note4: number | null;
  abs1: string | null;
  abs2: string | null;
  abs3: string | null;
  abs4: string | null;
};

export default async function ControleContinuPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: sheetsData, error } = await supabase
    .from("cc_sheets")
    .select("id, school_year, level_label, class_name, session_code, session_label, imported_at")
    .order("school_year", { ascending: false })
    .order("class_name")
    .order("session_code");

  // PostgREST caps a response at 1000 rows; a few years of classes exceed it.
  const studentsData: StudentRow[] = [];
  for (let from = 0; !error; from += 1000) {
    const { data } = await supabase
      .from("cc_students")
      .select("id, sheet_id, row_number, student_code, full_name, note1, note2, note3, note4, abs1, abs2, abs3, abs4")
      .order("id")
      .range(from, from + 999);
    studentsData.push(...((data ?? []) as StudentRow[]));
    if (!data || data.length < 1000) break;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Contrôle continu</h1>
        <Card className="p-6 text-sm text-destructive">
          Les tables du contrôle continu n&apos;existent pas encore dans la base de données. Applique la
          migration <code>supabase/migrations/0004_controle_continu.sql</code> puis recharge la page.
        </Card>
      </div>
    );
  }

  const sheets: SheetOption[] = (sheetsData ?? []).map((s) => ({
    id: s.id,
    schoolYear: s.school_year,
    levelLabel: s.level_label,
    className: s.class_name,
    sessionCode: s.session_code,
    sessionLabel: s.session_label,
  }));
  const students = studentsData;

  const bySheet = new Map<string, StudentRow[]>();
  for (const st of students) {
    const list = bySheet.get(st.sheet_id) ?? [];
    list.push(st);
    bySheet.set(st.sheet_id, list);
  }

  const summaries: SheetSummary[] = (sheetsData ?? []).map((s) => {
    const list = bySheet.get(s.id) ?? [];
    return {
      id: s.id,
      schoolYear: s.school_year,
      levelLabel: s.level_label,
      className: s.class_name,
      sessionLabel: s.session_label,
      studentCount: list.length,
      filled: [1, 2, 3, 4].map(
        (k) => list.filter((st) => st[`note${k}` as "note1"] != null || st[`abs${k}` as "abs1"] != null).length
      ),
      importedAt: s.imported_at,
    };
  });

  const { data: examsData } = await supabase
    .from("exams")
    .select("id, title, levels(name)")
    .order("created_at", { ascending: false });
  const exams: ExamOption[] = (examsData ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    levelName: (e.levels as unknown as { name: string } | null)?.name ?? null,
  }));

  const control = Number(sp.controle);
  const selected = sheets.find(
    (s) => s.schoolYear === sp.annee && s.className === sp.classe && s.sessionCode === sp.session
  );
  const validControl = Number.isInteger(control) && control >= 1 && control <= 4;

  let rows: GradeRow[] = [];
  if (selected && validControl) {
    rows = (bySheet.get(selected.id) ?? [])
      .sort((a, b) => a.row_number - b.row_number)
      .map((st) => ({
        id: st.id,
        studentCode: st.student_code,
        fullName: st.full_name,
        note: st[`note${control}` as "note1"] == null ? "" : String(Number(st[`note${control}` as "note1"])),
        absence: st[`abs${control}` as "abs1"] ?? "",
      }));
    if (sp.vide === "1") rows = rows.filter((r) => r.note === "" && r.absence === "");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contrôle continu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importe les fichiers « notes CC » exportés de Massar, saisis les notes ici, puis exporte le
          fichier rempli pour l&apos;importer dans Massar.
        </p>
      </div>

      <CcImport />

      <CcFilters sheets={sheets} current={sp} />

      {selected && validControl ? (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <h2 className="font-semibold">
              Résultats — {selected.className} · {selected.sessionLabel} · {CONTROL_LABELS[control - 1]}
            </h2>
            <span className="text-xs text-muted-foreground">
              {rows.length} élève{rows.length > 1 ? "s" : ""}
            </span>
          </div>
          <CcGradeTable
            key={`${selected.id}-${control}-${sp.vide ?? ""}`}
            sheetId={selected.id}
            control={control}
            rows={rows}
            exams={exams}
          />
        </Card>
      ) : sp.classe ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Choisis la classe, la session et le contrôle, puis clique sur « Chercher ».
        </Card>
      ) : null}

      <CcExport sheets={sheets} />

      <CcSheetList sheets={summaries} />
    </div>
  );
}
