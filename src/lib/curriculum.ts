import { createClient } from "@/lib/supabase/server";
import type { CurriculumTree } from "@/components/admin/exercises/curriculum-selector";

export async function getCurriculumTree(): Promise<CurriculumTree> {
  const supabase = await createClient();
  const [{ data: levels }, { data: units }, { data: sequences }, { data: sessions }] =
    await Promise.all([
      supabase.from("levels").select("id, name").order("order_index"),
      supabase.from("units").select("id, title, level_id").order("order_index"),
      supabase.from("sequences").select("id, title, unit_id").order("order_index"),
      supabase.from("sessions").select("id, title, sequence_id").order("order_index"),
    ]);

  return {
    levels: levels ?? [],
    units: units ?? [],
    sequences: sequences ?? [],
    sessions: sessions ?? [],
  };
}
