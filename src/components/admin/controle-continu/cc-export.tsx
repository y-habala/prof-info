"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SheetOption } from "./cc-filters";

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export function CcExport({ sheets }: { sheets: SheetOption[] }) {
  const years = uniq(sheets.map((s) => s.schoolYear));
  const [annee, setAnnee] = useState(years[0] ?? "");
  const [niveau, setNiveau] = useState("");
  const [classe, setClasse] = useState("");
  const [sheetId, setSheetId] = useState("");

  if (sheets.length === 0) return null;

  const inYear = sheets.filter((s) => s.schoolYear === annee);
  const levels = uniq(inYear.map((s) => s.levelLabel)).sort();
  const classes = uniq(inYear.filter((s) => !niveau || s.levelLabel === niveau).map((s) => s.className)).sort();
  const sessions = inYear.filter((s) => s.className === classe).sort((a, b) => a.sessionCode.localeCompare(b.sessionCode));

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Export des données</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Télécharge le fichier Massar d&apos;origine avec toutes les notes saisies (les 4 contrôles), prêt
          à être importé dans Massar.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Année scolaire :</Label>
          <Select
            value={annee}
            onChange={(e) => {
              setAnnee(e.target.value);
              setNiveau("");
              setClasse("");
              setSheetId("");
            }}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Niveau :</Label>
          <Select
            value={niveau}
            onChange={(e) => {
              setNiveau(e.target.value);
              setClasse("");
              setSheetId("");
            }}
          >
            <option value="">Tous les niveaux</option>
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Classe :</Label>
          <Select
            value={classe}
            onChange={(e) => {
              setClasse(e.target.value);
              setSheetId(inYear.find((s) => s.className === e.target.value)?.id ?? "");
            }}
          >
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Session :</Label>
          <Select value={sheetId} onChange={(e) => setSheetId(e.target.value)} disabled={!classe}>
            <option value="">—</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionLabel}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        {sheetId ? (
          <Button asChild>
            <a href={`/api/admin/controle-continu/${sheetId}/export`}>
              <Download className="size-4" />
              Export données
            </a>
          </Button>
        ) : (
          <Button type="button" disabled>
            <Download className="size-4" />
            Export données
          </Button>
        )}
      </div>
    </Card>
  );
}
