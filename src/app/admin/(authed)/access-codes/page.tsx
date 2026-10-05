import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AccessCodeDialog } from "@/components/admin/access-codes/access-code-dialog";
import { AccessCodesTable } from "@/components/admin/access-codes/access-codes-table";

export default async function AdminAccessCodesPage() {
  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("access_codes")
    .select("id, code, label, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Codes d&apos;accès</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les élèves utilisent un de ces codes pour entrer dans la plateforme.
          </p>
        </div>
        <AccessCodeDialog
          mode="create"
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              Nouveau code
            </Button>
          }
        />
      </div>
      <AccessCodesTable codes={codes ?? []} />
    </div>
  );
}
