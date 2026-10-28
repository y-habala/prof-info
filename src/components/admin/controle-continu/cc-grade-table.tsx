"use client";
import { useRef, useState } from "react";
import { Check, Loader2, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCcGrades, gradesFromExam } from "@/actions/controle-continu";
import { ABSENCE_VALUES } from "@/lib/massar/cc-constants";
import { cn } from "@/lib/utils";

export type GradeRow = { id: string; studentCode: string; fullName: string; note: string; absence: string };
export type ExamOption = { id: string; title: string; levelName: string | null };

function invalid(note: string) {
  const raw = note.trim().replace(",", ".");
  if (raw === "") return false;
  const n = Number(raw);
  return !Number.isFinite(n) || n < 0 || n > 20;
}

export function CcGradeTable({
  sheetId,
  control,
  rows,
  exams,
}: {
  sheetId: string;
  control: number;
  rows: GradeRow[];
  exams: ExamOption[];
}) {
  const [examId, setExamId] = useState("");
  const [filling, setFilling] = useState(false);
  const [filledIds, setFilledIds] = useState<Set<string>>(new Set());
  const [fillReport, setFillReport] = useState<{ count: number; total: number; unmatched: string[] } | null>(null);
  const [values, setValues] = useState(rows);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function update(i: number, patch: Partial<GradeRow>) {
    setValues((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setDirty(true);
    setSavedAt(null);
  }

  async function fillFromExam() {
    if (!examId) return;
    setFilling(true);
    setError(null);
    const res = await gradesFromExam(sheetId, examId);
    setFilling(false);
    if (res.error || !res.matches) {
      setError(res.error ?? "Récupération impossible.");
      return;
    }
    const byId = new Map(res.matches.map((m) => [m.studentId, m.note]));
    const visible = values.filter((v) => byId.has(v.id));
    setValues((prev) => prev.map((r) => (byId.has(r.id) ? { ...r, note: byId.get(r.id)! } : r)));
    setFilledIds(new Set(visible.map((v) => v.id)));
    setFillReport({ count: visible.length, total: res.attemptCount ?? 0, unmatched: res.unmatched ?? [] });
    if (visible.length > 0) {
      setDirty(true);
      setSavedAt(null);
    }
  }

  async function save() {
    if (values.some((v) => invalid(v.note))) {
      setError("Certaines notes sont invalides (elles doivent être entre 0 et 20).");
      return;
    }
    setPending(true);
    setError(null);
    const res = await saveCcGrades(
      sheetId,
      control,
      values.map((v) => ({ id: v.id, note: v.note, absence: v.absence }))
    );
    setPending(false);
    if (res.error) setError(res.error);
    else {
      setSavedAt(Date.now());
      setDirty(false);
    }
  }

  if (values.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">Aucun élève à afficher.</p>;
  }

  const filled = values.filter((v) => v.note.trim() !== "" || v.absence !== "").length;

  return (
    <div>
      {exams.length > 0 ? (
        <div className="space-y-2 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Remplir depuis un examen :</span>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="h-9 min-w-56 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Choisir un examen…</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                  {e.levelName ? ` (${e.levelName})` : ""}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={fillFromExam} disabled={!examId || filling} className="gap-2">
              {filling ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Remplir
            </Button>
          </div>
          {fillReport ? (
            <div className="text-xs">
              <p className={fillReport.count > 0 ? "text-success" : "text-muted-foreground"}>
                {fillReport.count} note{fillReport.count > 1 ? "s" : ""} reprise{fillReport.count > 1 ? "s" : ""} de
                l&apos;examen ({fillReport.total} copie{fillReport.total > 1 ? "s" : ""} rendue
                {fillReport.total > 1 ? "s" : ""} dans cette classe). Vérifie puis clique sur « Enregistrer ».
              </p>
              {fillReport.unmatched.length > 0 ? (
                <p className="mt-1 text-amber-700">
                  Copies non rattachées à un élève (nom différent de Massar) : {fillReport.unmatched.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <Button type="button" onClick={save} disabled={pending} className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Enregistrer
        </Button>
        <span className="text-xs text-muted-foreground">
          {filled}/{values.length} saisies
        </span>
        {savedAt && !dirty ? (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Enregistré
          </span>
        ) : null}
        {dirty ? <span className="text-xs font-medium text-amber-600">Modifications non enregistrées</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-2.5">#</th>
              <th className="px-4 py-2.5">Code élève</th>
              <th className="px-4 py-2.5">Nom et Prénom</th>
              <th className="w-32 px-4 py-2.5">Note</th>
              <th className="w-40 px-4 py-2.5">Absence</th>
            </tr>
          </thead>
          <tbody>
            {values.map((r, i) => (
              <tr key={r.id} className={cn("border-t border-border", filledIds.has(r.id) && "bg-success/10")}>
                <td className="px-4 py-2 text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.studentCode}</td>
                <td className="px-4 py-2 font-medium">{r.fullName}</td>
                <td className="px-4 py-1.5">
                  <Input
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={r.note}
                    inputMode="decimal"
                    aria-label={`Note de ${r.fullName}`}
                    onChange={(e) => update(i, { note: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        inputs.current[i + 1]?.focus();
                      }
                    }}
                    className={cn("h-9 w-24", invalid(r.note) && "border-destructive focus-visible:border-destructive")}
                  />
                </td>
                <td className="px-4 py-1.5">
                  <select
                    value={r.absence}
                    aria-label={`Absence de ${r.fullName}`}
                    onChange={(e) => update(i, { absence: e.target.value })}
                    className="h-9 w-32 rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">—</option>
                    {ABSENCE_VALUES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
