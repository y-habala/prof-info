import Link from "next/link";
import { ListOrdered } from "lucide-react";
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
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <ListOrdered className="size-5" />
          </div>
          <CardTitle className="text-base">{sequence.title}</CardTitle>
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
