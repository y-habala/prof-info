"use client";
import { useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteCcSheet } from "@/actions/controle-continu";
import { CONTROL_LABELS } from "@/lib/massar/cc-constants";
import { cn } from "@/lib/utils";

export type SheetSummary = {
  id: string;
  schoolYear: string;
  levelLabel: string;
  className: string;
  sessionLabel: string;
  studentCount: number;
  filled: number[];
  importedAt: string;
};

const SHORT = ["C1", "C2", "C3", "AI"];

export function CcSheetList({ sheets }: { sheets: SheetSummary[] }) {
  const [pending, startTransition] = useTransition();
  if (sheets.length === 0) return null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-semibold">Classes importées</h2>
        <p className="text-xs text-muted-foreground">
          Notes saisies par contrôle : {SHORT.map((s, i) => `${s} = ${CONTROL_LABELS[i]}`).join(" · ")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Année</th>
              <th className="px-4 py-2.5">Classe</th>
              <th className="px-4 py-2.5">Session</th>
              <th className="px-4 py-2.5">Élèves</th>
              {SHORT.map((s) => (
                <th key={s} className="px-3 py-2.5 text-center">
                  {s}
                </th>
              ))}
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sheets.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-2 text-xs text-muted-foreground">{s.schoolYear}</td>
                <td className="px-4 py-2">
                  <p className="font-semibold">{s.className}</p>
                  <p className="text-xs text-muted-foreground">{s.levelLabel}</p>
                </td>
                <td className="px-4 py-2">{s.sessionLabel}</td>
                <td className="px-4 py-2">{s.studentCount}</td>
                {s.filled.map((n, i) => (
                  <td key={i} className="px-3 py-2 text-center">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        n === 0
                          ? "bg-muted text-muted-foreground"
                          : n >= s.studentCount
                            ? "bg-success/15 text-success"
                            : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {n}/{s.studentCount}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/admin/controle-continu/${s.id}/export`} title="Exporter pour Massar">
                        <Download className="size-3.5" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      title="Supprimer"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Supprimer ${s.className} (${s.sessionLabel}) et toutes ses notes ?`)) {
                          startTransition(async () => {
                            await deleteCcSheet(s.id);
                          });
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
