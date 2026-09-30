import Link from "next/link";
import { BookOpen, Code2, Cpu, Terminal, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Level = {
  id: string;
  name: string;
  description: string | null;
};

// Cycled by position, not tied to a specific level name — 1/2/3APIC all
// teach the same subject, so the icon progression (fundamentals → code →
// systems) is a visual cue, not a claim about distinct institutions the
// way telmidtice's primaire/collège/lycée icons are.
const ICONS: LucideIcon[] = [BookOpen, Code2, Cpu, Terminal];
const ACCENTS = ["bg-level-1 text-level-1-foreground", "bg-level-2 text-level-2-foreground", "bg-level-3 text-level-3-foreground", "bg-level-4 text-level-4-foreground"];

export function LevelCard({ level, index = 0 }: { level: Level; index?: number }) {
  const Icon = ICONS[index % ICONS.length];
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <Link href={`/courses/${level.id}`}>
      <Card className="h-full items-center py-8 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="items-center">
          <div className={`mb-2 flex size-14 items-center justify-center rounded-2xl ${accent}`}>
            <Icon className="size-7" />
          </div>
          <CardTitle className="text-lg">{level.name}</CardTitle>
        </CardHeader>
        {level.description ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{level.description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
