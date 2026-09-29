import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AnnouncementDialog } from "@/components/admin/announcements/announcement-dialog";
import { AnnouncementsTable } from "@/components/admin/announcements/announcements-table";

export const metadata: Metadata = {
  title: "Actualités — Administration",
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, slug, description, content, image_url, type, is_published, published_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Actualités</h1>
        <AnnouncementDialog mode="create" trigger={<Button>+ Nouvelle actualité</Button>} />
      </div>
      <AnnouncementsTable announcements={announcements ?? []} />
    </div>
  );
}
