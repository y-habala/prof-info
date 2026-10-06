import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SessionBlocksEditor, type BlockRow } from "@/components/admin/curriculum/session-blocks-editor";
import type { BlockType } from "@/schemas/lesson-blocks";

export default async function AdminSessionBlocksPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, duration_minutes, sequences(title, units(title, levels(name, id)))")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();

  const seq = session.sequences as unknown as {
    title: string;
    units: { title: string; levels: { name: string; id: string } | null } | null;
  } | null;
  const breadcrumb = [
    seq?.units?.levels?.name,
    seq?.units?.title,
    seq?.title,
  ].filter(Boolean) as string[];
  const levelId = seq?.units?.levels?.id ?? null;

  const [{ data: blocks }, { data: exercisesList }] = await Promise.all([
    supabase
      .from("lesson_blocks")
      .select("id, type, title, content, order_index, is_published")
      .eq("session_id", sessionId)
      .order("order_index"),
    supabase
      .from("exercises")
      .select("id, title, level_id")
      .order("created_at", { ascending: false }),
  ]);

  const blockRows: BlockRow[] = (blocks ?? []).map((b) => ({
    id: b.id,
    type: b.type as BlockType,
    title: b.title,
    content: (b.content ?? {}) as Record<string, unknown>,
    order_index: b.order_index,
    is_published: b.is_published,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={levelId ? `/admin/curriculum?level=${levelId}` : "/admin/curriculum"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux cours
        </Link>
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
          <p className="text-sm text-muted-foreground">{breadcrumb.join(" › ")}</p>
          {session.duration_minutes ? (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {session.duration_minutes} min
            </p>
          ) : null}
        </div>
      </div>

      <SessionBlocksEditor sessionId={sessionId} blocks={blockRows} exercises={exercisesList ?? []} />
    </div>
  );
}
