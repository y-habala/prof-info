import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { HtmlPagesTable } from "@/components/admin/html-pages/html-pages-table";

export const metadata: Metadata = {
  title: "Activités HTML — Administration",
};

export default async function AdminHtmlPagesPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("html_pages")
    .select("id, title, slug, is_published")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activités HTML</h1>
        <Button nativeButton={false} render={<Link href="/admin/html-pages/new" />}>
          + Nouvelle activité
        </Button>
      </div>
      <HtmlPagesTable pages={pages ?? []} />
    </div>
  );
}
