import Link from "next/link";
import { PlayCircle, Clock } from "lucide-react";
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
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <PlayCircle className="size-5" />
          </div>
          <CardTitle className="text-base">{session.title}</CardTitle>
          {session.duration_minutes ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {session.duration_minutes} min
            </p>
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
