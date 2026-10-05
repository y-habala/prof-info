"use client";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessCodeDialog } from "./access-code-dialog";
import { toggleAccessCodeActive, deleteAccessCode } from "@/actions/access-codes";

export type AccessCodeRow = {
  id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
};

export function AccessCodesTable({ codes }: { codes: AccessCodeRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (codes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
        Aucun code pour le moment.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Libellé</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-lg font-bold tracking-widest">{row.code}</TableCell>
            <TableCell>{row.label ?? "—"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_active}
                  disabled={isPending}
                  onCheckedChange={(c) => startTransition(() => toggleAccessCodeActive(row.id, c))}
                />
                <Badge variant={row.is_active ? "success" : "secondary"}>
                  {row.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <AccessCodeDialog
                  mode="edit"
                  initialValues={{ id: row.id, code: row.code, label: row.label }}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Pencil className="size-3.5" />
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Supprimer le code ${row.code} ?`)) {
                      startTransition(() => deleteAccessCode(row.id));
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
