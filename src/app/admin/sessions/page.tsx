import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionDialog } from "@/components/admin/sessions/session-dialog";
import { SessionsTable } from "@/components/admin/sessions/sessions-table";

export const metadata: Metadata = {
  title: "Séances — Administration",
};

type UnitJoin = { title: string; level_id: string; levels: { name: string } | null } | null;

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ sequence?: string }>;
}) {
  const { sequence: sequenceId } = await searchParams;
  const supabase = await createClient();

  if (!sequenceId) {
    const { data: sequences } = await supabase
      .from("sequences")
      .select("id, title, unit_id, units(title, level_id, levels(name))")
      .order("order_index");

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Séances</h1>
        <p className="text-muted-foreground">Choisissez une séquence pour gérer ses séances.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(sequences ?? []).map((sequence) => {
            const unit = sequence.units as unknown as UnitJoin;
            return (
              <Link key={sequence.id} href={`/admin/sessions?sequence=${sequence.id}`}>
                <Card className="transition-colors hover:border-foreground/30">
                  <CardHeader>
                    <CardTitle>{sequence.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {unit?.levels?.name} · {unit?.title}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const { data: sequence } = await supabase
    .from("sequences")
    .select("id, title, unit_id, units(level_id)")
    .eq("id", sequenceId)
    .maybeSingle();
  const unit = sequence?.units as unknown as { level_id: string } | null;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, description, duration_minutes, order_index, is_published")
    .eq("sequence_id", sequenceId)
    .order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/sessions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Toutes les séquences
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Séances — {sequence?.title ?? "Séquence inconnue"}
          </h1>
          {sequence && unit ? (
            <SessionDialog
              mode="create"
              sequenceId={sequence.id}
              unitId={sequence.unit_id}
              levelId={unit.level_id}
              trigger={<Button>+ Nouvelle séance</Button>}
            />
          ) : null}
        </div>
      </div>
      {sequence && unit ? (
        <SessionsTable
          sessions={sessions ?? []}
          sequenceId={sequence.id}
          unitId={sequence.unit_id}
          levelId={unit.level_id}
        />
      ) : (
        <p className="text-muted-foreground">Séquence introuvable.</p>
      )}
    </div>
  );
}
