// Shared by the Massar file handler (server) and the grade-entry UI (client).
export const CONTROL_COUNT = 4;
export const CONTROL_LABELS = [
  "Premier contrôle",
  "Deuxième contrôle",
  "Troisième contrôle",
  "Activités intégrées",
] as const;
// The only non-empty value Massar's absence dropdown accepts.
export const ABSENCE_VALUES = ["Justifié"] as const;
