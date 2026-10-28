import "server-only";

export type PdfLogo = { data: Buffer; format: "png" | "jpg" } | null;

// Fetched by the route rather than by react-pdf so an unreachable logo just
// drops out of the header instead of failing the whole PDF.
export async function loadPdfLogo(url: string): Promise<PdfLogo> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    const format = type.includes("png") ? "png" : type.includes("jpeg") || type.includes("jpg") ? "jpg" : null;
    if (!format) return null;
    return { data: Buffer.from(await res.arrayBuffer()), format };
  } catch {
    return null;
  }
}

// School year of a given date: the Moroccan year starts in September.
export function schoolYearOf(date: Date): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 8 ? y : y - 1;
  return `${start}/${start + 1}`;
}

// "Contrôle N1 -Semestre II" → { devoir: "1", semester: "II" }. When the
// title has no semester, it follows the date (Sept–Jan: I, Feb–Aug: II).
export function examMetaFromTitle(title: string, date: Date) {
  const devoir = title.match(/\b(?:N|n)\s*°?\s*(\d+)/)?.[1] ?? title.match(/(?:contr[oô]le|devoir)\s*(\d+)/i)?.[1] ?? null;
  const roman = title.match(/semestre\s*(II|I|2|1)\b/i)?.[1]?.toUpperCase() ?? null;
  const fromTitle = roman === "2" ? "II" : roman === "1" ? "I" : roman;
  const m = date.getMonth();
  const fromDate = m >= 8 || m === 0 ? "I" : "II";
  return { devoir, semester: fromTitle ?? fromDate };
}
