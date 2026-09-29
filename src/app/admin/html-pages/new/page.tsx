import type { Metadata } from "next";
import Link from "next/link";
import { getCurriculumTree } from "@/lib/curriculum";
import { HtmlPageEditor } from "@/components/admin/html-pages/html-page-editor";

export const metadata: Metadata = {
  title: "Nouvelle activité HTML — Administration",
};

export default async function NewHtmlPagePage() {
  const tree = await getCurriculumTree();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/html-pages"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Retour aux activités
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nouvelle activité HTML</h1>
      </div>
      <HtmlPageEditor mode="create" tree={tree} />
    </div>
  );
}
