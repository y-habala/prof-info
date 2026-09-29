import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AccessCodeDialog } from "@/components/admin/access-codes/access-code-dialog";
import { AccessCodesTable } from "@/components/admin/access-codes/access-codes-table";

export const metadata: Metadata = {
  title: "Codes d'accès — Administration",
};

export default async function AccessCodesPage() {
  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("access_codes")
    .select("id, code, label, is_active, expires_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Codes d&apos;accès</h1>
        <AccessCodeDialog mode="create" trigger={<Button>+ Nouveau code</Button>} />
      </div>
      <AccessCodesTable codes={codes ?? []} />
    </div>
  );
}
