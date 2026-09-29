"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AccessCodeDialog } from "./access-code-dialog";
import { toggleAccessCodeActive, deleteAccessCode } from "@/actions/access-codes";

export type AccessCodeRow = {
  id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function AccessCodesTable({ codes }: { codes: AccessCodeRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (codes.length === 0) {
    return <p className="text-muted-foreground">Aucun code d&apos;accès pour le moment.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Expiration</TableHead>
          <TableHead>Date de création</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono">{row.code}</TableCell>
            <TableCell>{row.label ?? "—"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.is_active}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(() => toggleAccessCodeActive(row.id, checked))
                  }
                />
                <Badge variant={row.is_active ? "default" : "secondary"}>
                  {row.is_active ? "Actif" : "Désactivé"}
                </Badge>
              </div>
            </TableCell>
            <TableCell>{formatDate(row.expires_at)}</TableCell>
            <TableCell>{formatDate(row.created_at)}</TableCell>
            <TableCell className="text-right space-x-2">
              <AccessCodeDialog
                mode="edit"
                initialValues={{
                  id: row.id,
                  code: row.code,
                  label: row.label,
                  expiresAt: row.expires_at,
                }}
                trigger={
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                }
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer le code ${row.code} ?`)) {
                    startTransition(() => deleteAccessCode(row.id));
                  }
                }}
              >
                Supprimer
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
