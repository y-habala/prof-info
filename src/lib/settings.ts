import "server-only";
import { createClient } from "@/lib/supabase/server";

// School / teacher settings read from the `settings` key-value table.
// Rendered into the student header footer, PDF reports, etc. Keys match the
// seed in supabase/migrations/0001_v2_schema.sql.
export type SettingsBundle = {
  teacher_name: string;
  institution: string;
  academie: string;
  direction: string;
  /** Arabic lines printed under the logo on exam sheets; optional. */
  academie_ar: string;
  direction_ar: string;
  /** Public URL of the PNG/JPEG logo shown on exam sheets; "" when none. */
  exam_logo_url: string;
  /** School year printed on exam sheets, e.g. "2026/2027"; "" = derive from the date. */
  school_year: string;
  /** Level label printed on exam sheets per level name, e.g. {"3APIC": "3ème année collégiale"}. */
  level_labels: Record<string, string>;
  /** Number of classes per level name, e.g. {"1APIC": 4, "2APIC": 3} */
  class_counts: Record<string, number>;
};

const DEFAULTS: SettingsBundle = {
  teacher_name: "—",
  institution: "—",
  academie: "—",
  direction: "—",
  academie_ar: "",
  direction_ar: "",
  exam_logo_url: "",
  school_year: "",
  level_labels: {},
  class_counts: {},
};

export async function getSettings(): Promise<SettingsBundle> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  if (!data) return DEFAULTS;
  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
  let class_counts: Record<string, number> = {};
  try {
    class_counts = JSON.parse(map.class_counts ?? "{}") as Record<string, number>;
  } catch {
    class_counts = {};
  }
  let level_labels: Record<string, string> = {};
  try {
    level_labels = JSON.parse(map.level_labels ?? "{}") as Record<string, string>;
  } catch {
    level_labels = {};
  }
  return {
    teacher_name: map.teacher_name ?? DEFAULTS.teacher_name,
    institution: map.institution ?? DEFAULTS.institution,
    academie: map.academie ?? DEFAULTS.academie,
    direction: map.direction ?? DEFAULTS.direction,
    academie_ar: map.academie_ar ?? DEFAULTS.academie_ar,
    direction_ar: map.direction_ar ?? DEFAULTS.direction_ar,
    exam_logo_url: map.exam_logo_url ?? DEFAULTS.exam_logo_url,
    school_year: map.school_year ?? DEFAULTS.school_year,
    level_labels,
    class_counts,
  };
}
