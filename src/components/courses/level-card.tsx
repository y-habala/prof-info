import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Level = {
  id: string;
  name: string;
  description: string | null;
};

export function LevelCard({ level }: { level: Level }) {
  return (
    <Link href={`/courses/${level.id}`}>
      <Card className="h-full transition-colors hover:border-foreground/30">
        <CardHeader>
          <CardTitle>{level.name}</CardTitle>
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
