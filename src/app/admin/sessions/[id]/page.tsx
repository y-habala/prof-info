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
    .select("id, title, sequence_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const { data: blocks } = await supabase
    .from("lesson_contents")
    .select("id, type, title, content, order_index, is_published")
    .eq("session_id", sessionId)
    .order("order_index");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/sessions?sequence=${session.sequence_id}`}
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
            trigger={<Button>+ Ajouter un bloc</Button>}
          />
        </div>
      </div>
      <BlocksList sessionId={session.id} initialBlocks={(blocks ?? []) as BlockRow[]} />
    </div>
  );
}
