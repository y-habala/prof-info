"use client";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { saveSettings } from "@/actions/settings";
import type { SettingsBundle } from "@/lib/settings";

type Level = { id: string; name: string };

export function SettingsForm({ initial, levels }: { initial: SettingsBundle; levels: Level[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await saveSettings(undefined, formData);
    setIsPending(false);
    if (result?.error) setError(result.error);
    else if (result?.success) setSavedAt(Date.now());
  }

  const saved = savedAt !== null;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <form action={handleAction} className="space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Informations institutionnelles
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="teacher_name">Enseignant(e)</Label>
              <Input id="teacher_name" name="teacher_name" defaultValue={initial.teacher_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Établissement</Label>
              <Input id="institution" name="institution" defaultValue={initial.institution} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academie">Académie</Label>
              <Input id="academie" name="academie" defaultValue={initial.academie} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Input id="direction" name="direction" defaultValue={initial.direction} required />
            </div>
          </div>

          {levels.length > 0 && (
            <>
              <div className="border-t border-border pt-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Nombre de classes par niveau
                </h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Utilisé pour générer la liste des classes dans le formulaire d&apos;accès à l&apos;examen.
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {levels.map((level) => (
                    <div key={level.id} className="space-y-2">
                      <Label htmlFor={`class_count_${level.name}`}>{level.name}</Label>
                      <Input
                        id={`class_count_${level.name}`}
                        name={`class_count_${level.name}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="20"
                        defaultValue={initial.class_counts[level.name] ?? 0}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <Check className="size-4" />
                Enregistré
              </span>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
