import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Unit = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
};

export function UnitCard({ levelId, unit }: { levelId: string; unit: Unit }) {
  return (
    <Link href={`/courses/${levelId}/${unit.id}`}>
      <Card className="h-full overflow-hidden transition-colors hover:border-foreground/30">
        {unit.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, no fixed domain to allow in next/image yet
          <img src={unit.image_url} alt="" className="h-32 w-full object-cover" />
        ) : null}
        <CardHeader>
          <CardTitle>{unit.title}</CardTitle>
        </CardHeader>
        {unit.description ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{unit.description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
