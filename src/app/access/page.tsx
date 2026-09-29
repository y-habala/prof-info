import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessForm } from "@/components/access/access-form";

export const metadata: Metadata = {
  title: "Accès — Plateforme Informatique",
};

export default function AccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Plateforme Informatique</CardTitle>
          <p className="text-sm text-muted-foreground">
            Entrez votre code d&apos;accès pour accéder à la plateforme.
          </p>
        </CardHeader>
        <CardContent>
          <AccessForm />
        </CardContent>
      </Card>
    </div>
  );
}
