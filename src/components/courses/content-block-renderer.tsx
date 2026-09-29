import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toYoutubeEmbedUrl } from "@/lib/utils/youtube";
import type { BlockContentValues } from "@/components/admin/lesson-contents/block-form-fields";
import type { BlockType } from "@/schemas/lesson-contents";

export type PublishedBlock = {
  id: string;
  type: BlockType;
  title: string | null;
  content: BlockContentValues;
};

function BlockBody({ block }: { block: PublishedBlock }) {
  switch (block.type) {
    case "text":
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{block.content.text}</p>;
    case "image":
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL */}
          <img src={block.content.url} alt={block.content.caption ?? ""} className="w-full rounded-md" />
          {block.content.caption ? (
            <figcaption className="mt-1 text-xs text-muted-foreground">
              {block.content.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    case "video": {
      const embedUrl = block.content.youtube_url
        ? toYoutubeEmbedUrl(block.content.youtube_url)
        : null;
      if (embedUrl) {
        return (
          <div className="aspect-video w-full overflow-hidden rounded-md">
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      if (block.content.video_url) {
        return <video src={block.content.video_url} controls className="w-full rounded-md" />;
      }
      return null;
    }
    case "pdf":
      return (
        <div className="space-y-2">
          <iframe src={block.content.file_url} className="h-[500px] w-full rounded-md border" />
          <a
            href={block.content.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-4"
          >
            Télécharger {block.content.file_name}
          </a>
        </div>
      );
    case "file":
      return (
        <a
          href={block.content.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline underline-offset-4"
        >
          Télécharger {block.content.file_name}
        </a>
      );
  }
}

export function ContentBlockRenderer({ block }: { block: PublishedBlock }) {
  if (!block.title) {
    return (
      <div>
        <BlockBody block={block} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{block.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <BlockBody block={block} />
      </CardContent>
    </Card>
  );
}
