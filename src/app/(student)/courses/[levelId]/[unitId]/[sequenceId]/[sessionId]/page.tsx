import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Download, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarkdownRenderer } from "@/components/student/markdown-renderer";
import { SandboxedActivity } from "@/components/student/sandboxed-activity";
import { InlineExerciseRunner } from "@/components/student/inline-exercise-runner";
import type { BlockType } from "@/schemas/lesson-blocks";

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#/]+)/
  );
  return m ? m[1] : null;
}

type Block = {
  id: string;
  type: BlockType;
  title: string | null;
  content: Record<string, unknown>;
};

// Async Server Component — fetches exercise data (bypasses RLS with admin client
// since exercise_questions/options are restricted to anon users).
async function ExerciseBlock({ exerciseId }: { exerciseId: string }) {
  const admin = createAdminClient();

  const { data: exercise } = await admin
    .from("exercises")
    .select("id, title")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) {
    return (
      <p className="text-sm italic text-muted-foreground">Exercice introuvable.</p>
    );
  }

  const { data: questions } = await admin
    .from("exercise_questions")
    .select("id, question_text, question_type, points, order_index")
    .eq("exercise_id", exerciseId)
    .order("order_index");

  const qIds = (questions ?? []).map((q) => q.id);

  const { data: options } =
    qIds.length > 0
      ? await admin
          .from("exercise_options")
          .select("id, question_id, option_text, order_index")
          .in("question_id", qIds)
          .order("order_index")
      : { data: [] as { id: string; question_id: string; option_text: string; order_index: number }[] };

  const qs = (questions ?? []).map((q) => ({
    id: q.id,
    text: q.question_text,
    type: q.question_type,
    points: Number(q.points),
    options: (options ?? [])
      .filter((o) => o.question_id === q.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((o) => ({ id: o.id, text: o.option_text })),
  }));

  return (
    <InlineExerciseRunner
      exerciseId={exerciseId}
      exerciseTitle={exercise.title}
      questions={qs}
    />
  );
}

function BlockContent({ block }: { block: Block }) {
  switch (block.type) {
    case "text": {
      const md = String(block.content.markdown ?? "");
      return md.trim() ? (
        <MarkdownRenderer source={md} />
      ) : (
        <p className="text-sm italic text-muted-foreground">Bloc texte vide.</p>
      );
    }

    case "image": {
      const url = String(block.content.url ?? "");
      const caption = String(block.content.caption ?? "");
      if (!url)
        return (
          <p className="text-sm italic text-muted-foreground">Image non disponible.</p>
        );
      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={caption || block.title || "Image"}
            className="max-h-[500px] w-full rounded-xl border border-border object-contain"
          />
          {caption ? (
            <figcaption className="text-center text-sm text-muted-foreground">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "video": {
      const ytUrl = String(block.content.youtube_url ?? "");
      const videoUrl = String(block.content.video_url ?? "");
      const ytId = ytUrl ? getYouTubeId(ytUrl) : null;

      if (ytId) {
        return (
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
              title={block.title ?? "Vidéo"}
            />
          </div>
        );
      }
      if (videoUrl) {
        return (
            <video
            src={videoUrl}
            controls
            className="w-full rounded-xl border border-border"
          />
        );
      }
      return (
        <p className="text-sm italic text-muted-foreground">Vidéo non disponible.</p>
      );
    }

    case "file": {
      const url = String(block.content.url ?? "");
      const fileName =
        String(block.content.file_name ?? "") || url.split("/").pop() || "Télécharger";
      if (!url)
        return (
          <p className="text-sm italic text-muted-foreground">Fichier non disponible.</p>
        );
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Download className="size-4 shrink-0" />
          {fileName}
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
        </a>
      );
    }

    case "exercise": {
      const exerciseId = String(block.content.exercise_id ?? "");
      if (!exerciseId)
        return (
          <p className="text-sm italic text-muted-foreground">
            Exercice non configuré.
          </p>
        );
      return (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              Chargement de l&apos;exercice…
            </p>
          }
        >
          <ExerciseBlock exerciseId={exerciseId} />
        </Suspense>
      );
    }

    case "interactive": {
      const html = String(block.content.html ?? "");
      const css = String(block.content.css ?? "");
      const js = String(block.content.js ?? "");
      return <SandboxedActivity html={html} css={css} js={js} />;
    }
  }
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{
    levelId: string;
    unitId: string;
    sequenceId: string;
    sessionId: string;
  }>;
}) {
  const { levelId, sessionId } = await params;
  const supabase = await createClient();

  const [{ data: session }, { data: blocksData }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, title, duration_minutes, content_markdown, unit_id")
      .eq("id", sessionId)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("lesson_blocks")
      .select("id, type, title, content, order_index")
      .eq("session_id", sessionId)
      .eq("is_published", true)
      .order("order_index"),
  ]);

  if (!session) notFound();

  // The level is read through the unit, not the séquence: a séance without a
  // séquence still belongs to a unit, so this resolves either way.
  const { data: unit } = await supabase
    .from("units")
    .select("levels(name)")
    .eq("id", session.unit_id)
    .maybeSingle();
  const levelName =
    (unit?.levels as unknown as { name: string } | null)?.name ?? null;

  const blocks: Block[] = (blocksData ?? []).map((b) => ({
    id: b.id,
    type: b.type as BlockType,
    title: b.title,
    content: (b.content ?? {}) as Record<string, unknown>,
  }));

  const hasBlocks = blocks.length > 0;
  const legacyMarkdown = session.content_markdown?.trim() ?? "";

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

      {hasBlocks ? (
        <div className="space-y-8">
          {blocks.map((block) => (
            <section key={block.id}>
              {block.title ? (
                <h2 className="mb-3 text-lg font-semibold">{block.title}</h2>
              ) : null}
              <BlockContent block={block} />
            </section>
          ))}
        </div>
      ) : legacyMarkdown ? (
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <MarkdownRenderer source={legacyMarkdown} />
        </article>
      ) : (
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-muted-foreground">Contenu bientôt disponible.</p>
        </article>
      )}
    </div>
  );
}
