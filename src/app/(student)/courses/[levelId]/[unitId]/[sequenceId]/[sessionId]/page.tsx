import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MarkdownRenderer } from "@/components/student/markdown-renderer";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ levelId: string; sequenceId: string; sessionId: string }>;
}) {
  const { levelId, sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, duration_minutes, content_markdown, sequence_id, sequences(unit_id, units(level_id, levels(name)))")
    .eq("id", sessionId)
    .eq("is_published", true)
    .maybeSingle();

  if (!session) notFound();

  const ancestry = session.sequences as unknown as {
    unit_id: string;
    units: { level_id: string; levels: { name: string } | null } | null;
  } | null;
  const levelName = ancestry?.units?.levels?.name ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div>
        <Link
          href={`/courses/${levelId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour {levelName ? `à ${levelName}` : "au niveau"}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{session.title}</h1>
        {session.duration_minutes ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            Durée indicative : {session.duration_minutes} min
          </p>
        ) : null}
      </div>

      <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {session.content_markdown?.trim() ? (
          <MarkdownRenderer source={session.content_markdown} />
        ) : (
          <p className="text-muted-foreground">Contenu bientôt disponible.</p>
        )}
      </article>
    </div>
  );
}
