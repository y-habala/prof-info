import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Administration — Plateforme Informatique" };

export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
