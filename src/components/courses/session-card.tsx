import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Session = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
};

export function SessionCard({
  levelId,
  unitId,
  sequenceId,
  session,
}: {
  levelId: string;
  unitId: string;
  sequenceId: string;
  session: Session;
}) {
  return (
    <Link href={`/courses/${levelId}/${unitId}/${sequenceId}/${session.id}`}>
      <Card className="h-full transition-colors hover:border-foreground/30">
        <CardHeader>
          <CardTitle>{session.title}</CardTitle>
          {session.duration_minutes ? (
            <p className="text-sm text-muted-foreground">{session.duration_minutes} min</p>
          ) : null}
        </CardHeader>
        {session.description ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{session.description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
