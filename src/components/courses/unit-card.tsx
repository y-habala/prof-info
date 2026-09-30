import Link from "next/link";
import { Folder } from "lucide-react";
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
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
        {unit.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, no fixed domain to allow in next/image yet
          <img src={unit.image_url} alt="" className="h-32 w-full object-cover" />
        ) : null}
        <CardHeader>
          {!unit.image_url ? (
            <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Folder className="size-5" />
            </div>
          ) : null}
          <CardTitle className="text-base">{unit.title}</CardTitle>
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
