// Grade bands used by the class report (PDF) and the reports page.
export type Mention = { label: string; color: string; test: (s: number) => boolean };

export const MENTIONS: Mention[] = [
  { label: "Excellent", color: "#15803d", test: (s) => s >= 18 },
  { label: "Très bien", color: "#16a34a", test: (s) => s >= 16 && s < 18 },
  { label: "Bien", color: "#2563eb", test: (s) => s >= 14 && s < 16 },
  { label: "Moyen", color: "#9333ea", test: (s) => s >= 10 && s < 14 },
  { label: "Insuffisant", color: "#dc2626", test: (s) => s < 10 },
];

export const mentionOf = (s: number) => MENTIONS.find((m) => m.test(s)) ?? MENTIONS[MENTIONS.length - 1];
