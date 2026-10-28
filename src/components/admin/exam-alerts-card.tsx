import Link from "next/link";
import { AlertTriangle, CheckCircle2, Copy, Hash, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ExamAlert } from "@/lib/exam-alerts";

const KIND = {
  duplicate: { label: "Doublon", icon: Copy, tint: "bg-rose-50 text-rose-700" },
  number: { label: "N° en double", icon: Hash, tint: "bg-amber-50 text-amber-800" },
  unknown: { label: "Nom introuvable", icon: UserX, tint: "bg-sky-50 text-sky-700" },
} as const;

const MAX_SHOWN = 30;

export function ExamAlertsCard({ alerts }: { alerts: ExamAlert[] }) {
  if (alerts.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <CheckCircle2 className="size-5 text-success" />
        <p className="text-sm">
          <span className="font-semibold">Aucune anomalie</span>{" "}
          <span className="text-muted-foreground">dans les copies d&apos;examen (doublons, numéros, noms).</span>
        </p>
      </Card>
    );
  }

  const counts = alerts.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.kind]: (acc[a.kind] ?? 0) + 1 }), {});

  return (
    <Card className="overflow-hidden border-amber-300 p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-amber-50 px-5 py-3">
        <AlertTriangle className="size-5 text-amber-600" />
        <h2 className="font-semibold">
          {alerts.length} alerte{alerts.length > 1 ? "s" : ""} à vérifier
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) =>
            counts[k] ? (
              <span key={k} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KIND[k].tint}`}>
                {KIND[k].label} : {counts[k]}
              </span>
            ) : null
          )}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {alerts.slice(0, MAX_SHOWN).map((a, i) => {
          const k = KIND[a.kind];
          const Icon = k.icon;
          return (
            <li key={i} className="flex items-start gap-3 px-5 py-3">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${k.tint}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {k.label} · {a.examTitle} · {a.className}
                </p>
              </div>
              <Link
                href={`/admin/results/exams/${a.examId}?class=${encodeURIComponent(a.className)}`}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Voir
              </Link>
            </li>
          );
        })}
      </ul>
      {alerts.length > MAX_SHOWN ? (
        <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">
          + {alerts.length - MAX_SHOWN} autres alertes.
        </p>
      ) : null}
    </Card>
  );
}
