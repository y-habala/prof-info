"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CONTROL_LABELS } from "@/lib/massar/cc-constants";

export type SheetOption = {
  id: string;
  schoolYear: string;
  levelLabel: string;
  className: string;
  sessionCode: string;
  sessionLabel: string;
};

type Current = { annee?: string; niveau?: string; classe?: string; session?: string; controle?: string; vide?: string };

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export function CcFilters({ sheets, current }: { sheets: SheetOption[]; current: Current }) {
  const router = useRouter();
  const years = uniq(sheets.map((s) => s.schoolYear));
  const [annee, setAnnee] = useState(current.annee ?? years[0] ?? "");
  const [niveau, setNiveau] = useState(current.niveau ?? "");
  const [classe, setClasse] = useState(current.classe ?? "");
  const [session, setSession] = useState(current.session ?? "");
  const [controle, setControle] = useState(current.controle ?? "1");
  const [vide, setVide] = useState(current.vide === "1");

  const inYear = sheets.filter((s) => s.schoolYear === annee);
  const levels = uniq(inYear.map((s) => s.levelLabel)).sort();
  const classes = uniq(inYear.filter((s) => !niveau || s.levelLabel === niveau).map((s) => s.className)).sort();
  const sessions = inYear
    .filter((s) => s.className === classe)
    .map((s) => ({ code: s.sessionCode, label: s.sessionLabel }))
    .sort((a, b) => a.code.localeCompare(b.code));

  function search() {
    const p = new URLSearchParams({ annee, niveau, classe, session, controle });
    if (vide) p.set("vide", "1");
    router.push(`/admin/controle-continu?${p.toString()}`);
  }

  if (sheets.length === 0) {
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        Aucune classe importée pour le moment. Commence par importer un fichier Massar ci-dessus.
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold">Saisie des notes</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Année scolaire">
          <Select
            value={annee}
            onChange={(e) => {
              setAnnee(e.target.value);
              setNiveau("");
              setClasse("");
              setSession("");
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Niveau">
          <Select
            value={niveau}
            onChange={(e) => {
              setNiveau(e.target.value);
              setClasse("");
              setSession("");
            }}
          >
            <option value="">Tous les niveaux</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Classe">
          <Select
            value={classe}
            onChange={(e) => {
              setClasse(e.target.value);
              const first = inYear.find((s) => s.className === e.target.value);
              setSession(first?.sessionCode ?? "");
            }}
          >
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Session">
          <Select value={session} onChange={(e) => setSession(e.target.value)} disabled={!classe}>
            <option value="">—</option>
            {sessions.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contrôle continu">
          <Select value={controle} onChange={(e) => setControle(e.target.value)}>
            {CONTROL_LABELS.map((l, i) => (
              <option key={l} value={String(i + 1)}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={vide} onChange={(e) => setVide(e.target.checked)} className="size-4" />
          N&apos;afficher que les élèves sans notes
        </label>
        <Button type="button" onClick={search} disabled={!classe || !session} className="gap-2">
          <Search className="size-4" />
          Chercher
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} :</Label>
      {children}
    </div>
  );
}
