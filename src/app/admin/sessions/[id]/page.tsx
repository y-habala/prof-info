import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BlockDialog } from "@/components/admin/lesson-contents/block-dialog";
import { BlocksList, type BlockRow } from "@/components/admin/lesson-contents/blocks-list";

export const metadata: Metadata = {
  title: "Contenu de la séance — Administration",
};

export default async function AdminSessionContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, sequence_id, sequences(unit_id, units(level_id))")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const ancestry = session.sequences as unknown as { unit_id: string; units: { level_id: string } | null } | null;
  const levelId = ancestry?.units?.level_id;

  const [{ data: blocks }, { data: exercises }, { data: htmlPages }] = await Promise.all([
    supabase
      .from("lesson_contents")
      .select("id, type, title, content, order_index, is_published")
      .eq("session_id", sessionId)
      .order("order_index"),
    supabase.from("exercises").select("id, title").order("created_at", { ascending: false }),
    supabase.from("html_pages").select("id, title").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={levelId ? `/admin/sessions?level=${levelId}` : "/admin/sessions"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Retour aux séances
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Contenu — {session.title}</h1>
          <BlockDialog
            mode="create"
            sessionId={session.id}
            nextOrderIndex={blocks?.length ?? 0}
            exercises={exercises ?? []}
            htmlPages={htmlPages ?? []}
            trigger={<Button>+ Ajouter un bloc</Button>}
          />
        </div>
      </div>
      <BlocksList
        sessionId={session.id}
        initialBlocks={(blocks ?? []) as BlockRow[]}
        exercises={exercises ?? []}
        htmlPages={htmlPages ?? []}
      />
    </div>
  );
}
