import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Sequence = {
  id: string;
  title: string;
  description: string | null;
};

export function SequenceCard({
  levelId,
  unitId,
  sequence,
}: {
  levelId: string;
  unitId: string;
  sequence: Sequence;
}) {
  return (
    <Link href={`/courses/${levelId}/${unitId}/${sequence.id}`}>
      <Card className="h-full transition-colors hover:border-foreground/30">
        <CardHeader>
          <CardTitle>{sequence.title}</CardTitle>
        </CardHeader>
        {sequence.description ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{sequence.description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
