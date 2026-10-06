import Link from "next/link";
import { Library, GraduationCap, KeyRound, ArrowRight, Users, TrendingUp, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { scoreOutOf20 } from "@/lib/grading";

async function countRows(table: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [levels, sessionsCount, exams, codes, { data: attempts }] = await Promise.all([
    countRows("levels"),
    countRows("sessions"),
    countRows("exams"),
    countRows("access_codes"),
    supabase.from("exam_attempts").select("score, max_score, submitted_at"),
  ]);

  const submitted = (attempts ?? []).filter((a) => a.submitted_at);
  const avg20 =
    submitted.length > 0
      ? submitted.reduce(
          (acc, a) => acc + scoreOutOf20(Number(a.score ?? 0), Number(a.max_score ?? 0)),
          0
        ) / submitted.length
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d&apos;ensemble de la plateforme.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Niveaux" value={levels} icon={GraduationCap} tint="bg-blue-50 text-blue-600" />
        <StatCard label="Séances" value={sessionsCount} icon={Library} tint="bg-emerald-50 text-emerald-600" />
        <StatCard label="Examens" value={exams} icon={GraduationCap} tint="bg-fuchsia-50 text-fuchsia-600" />
        <StatCard label="Codes d'accès" value={codes} icon={KeyRound} tint="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatCard
          label="Tentatives soumises"
          value={submitted.length}
          icon={Users}
          tint="bg-cyan-50 text-cyan-700"
        />
        <StatCard
          label="Moyenne générale"
          value={avg20 !== null ? `${avg20.toFixed(2)}/20` : "—"}
          icon={TrendingUp}
          tint="bg-violet-50 text-violet-700"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Accès rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickLink href="/admin/curriculum" title="Gérer les cours" desc="Niveaux, unités, séquences, séances et leurs blocs" icon={Library} />
          <QuickLink href="/admin/exams" title="Gérer les examens" desc="Créer un examen et ses modèles A/B/C/D" icon={GraduationCap} />
          <QuickLink href="/admin/results" title="Voir les résultats" desc="Tentatives, moyennes, exports PDF/Excel" icon={BarChart3} />
          <QuickLink href="/admin/settings" title="Paramètres" desc="Nom de l'enseignant, école, académie…" icon={KeyRound} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number | string;
  icon: typeof GraduationCap;
  tint: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon: Icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: typeof Library;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
