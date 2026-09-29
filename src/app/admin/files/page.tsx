import type { Metadata } from "next";
import { listFiles } from "@/actions/files";
import { FilesManager } from "@/components/admin/files/files-manager";

export const metadata: Metadata = {
  title: "Fichiers — Administration",
};

export default async function AdminFilesPage() {
  const [lessonImages, lessonFiles, documents] = await Promise.all([
    listFiles("lesson-images"),
    listFiles("lesson-files"),
    listFiles("documents"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fichiers</h1>
      <FilesManager lessonImages={lessonImages} lessonFiles={lessonFiles} documents={documents} />
    </div>
  );
}
