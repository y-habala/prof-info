import "server-only";
import JSZip from "jszip";

// Massar "notes CC" export (export_notesCC_<classe>_<matière>.xlsx).
// The workbook uses prefixed SpreadsheetML (<x:c>, <x:v>…) that ExcelJS can't
// read, so it is handled as raw XML. On export only the grade/absence cells
// of student rows are rewritten; everything else (hidden Massar IDs, sheet
// protection, validations) stays byte-for-byte as Massar produced it.

import { CONTROL_COUNT } from "./cc-constants";

export type CcStudentRow = {
  rowNumber: number;
  massarId: string | null;
  studentCode: string;
  fullName: string;
  birthDate: string | null;
  notes: (number | null)[];
  absences: (string | null)[];
};

export type CcParsedFile = {
  schoolYear: string;
  levelLabel: string;
  className: string;
  sessionCode: string;
  sessionLabel: string;
  teacher: string | null;
  establishment: string | null;
  massarMeta: Record<string, string>;
  students: CcStudentRow[];
};

export class MassarFileError extends Error {}

type Cell = { ref: string; col: string; row: number; raw: string; value: string | null };

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
const encode = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CELL_RE = /<((?:\w+:)?c)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;

function attr(attrs: string, name: string) {
  return attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
}

async function loadParts(buffer: ArrayBuffer | Buffer) {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new MassarFileError("Le fichier n'est pas un classeur Excel valide (.xlsx).");
  }
  const workbook = await zip.file("xl/workbook.xml")?.async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!workbook || !rels) throw new MassarFileError("Classeur Excel incomplet.");

  // The first sheet in workbook order is NotesCC.
  const firstSheet = workbook.match(/<(?:\w+:)?sheet\b[^>]*?r:id="([^"]+)"/);
  const rid = firstSheet?.[1];
  const target = rid ? rels.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`))?.[1] ?? rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${rid}"`))?.[1] : null;
  if (!target) throw new MassarFileError("Feuille de notes introuvable dans le fichier.");
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  const sheetXml = await zip.file(sheetPath)?.async("string");
  if (!sheetXml) throw new MassarFileError("Feuille de notes illisible.");

  const sharedXml = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const shared = [...sharedXml.matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(([, si]) =>
    decode([...si.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((m) => m[1]).join(""))
  );
  return { zip, sheetPath, sheetXml, shared };
}

function readCells(sheetXml: string, shared: string[]): Map<string, Cell> {
  const cells = new Map<string, Cell>();
  for (const m of sheetXml.matchAll(CELL_RE)) {
    const [raw, , attrs, body] = m;
    const ref = attr(attrs, "r");
    if (!ref) continue;
    const parts = ref.match(/^([A-Z]+)(\d+)$/);
    if (!parts) continue;
    let value: string | null = null;
    if (body) {
      const t = attr(attrs, "t");
      const v = body.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
      const inline = body.match(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/)?.[1];
      if (t === "s" && v !== undefined) value = shared[Number(v)] ?? null;
      else if (v !== undefined) value = decode(v);
      else if (inline !== undefined) value = decode(inline);
    }
    cells.set(ref, { ref, col: parts[1], row: Number(parts[2]), raw, value: value?.trim() ? value.trim() : null });
  }
  return cells;
}

const nextCol = (col: string) => String.fromCharCode(col.charCodeAt(0) + 1);

// Row 15 tags each Massar column with #1# … #4#; the absence column follows.
function controlColumns(cells: Map<string, Cell>) {
  const cols: { note: string; abs: string }[] = [];
  for (let i = 1; i <= CONTROL_COUNT; i++) {
    const tag = [...cells.values()].find((c) => c.row === 15 && c.value === `#${i}#`);
    if (!tag) throw new MassarFileError("Colonnes des contrôles introuvables : ce n'est pas un export « notes CC » de Massar.");
    cols.push({ note: tag.col, abs: nextCol(tag.col) });
  }
  return cols;
}

function parseNote(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 20 ? Math.round(n * 100) / 100 : null;
}

export async function parseMassarCcFile(buffer: ArrayBuffer | Buffer): Promise<CcParsedFile> {
  const { sheetXml, shared } = await loadParts(buffer);
  const cells = readCells(sheetXml, shared);
  const get = (ref: string) => cells.get(ref)?.value ?? null;

  const className = get("I9");
  const levelLabel = get("D9");
  const sessionLabel = get("D11");
  const schoolYear = get("D13");
  const sessionCode = get("G5");
  if (!className || !levelLabel || !sessionLabel || !schoolYear || !sessionCode) {
    throw new MassarFileError("Ce fichier n'est pas un export Massar des notes de contrôle continu.");
  }
  const cols = controlColumns(cells);

  const students: CcStudentRow[] = [];
  const lastRow = Math.max(...[...cells.values()].map((c) => c.row));
  for (let r = 18; r <= lastRow; r++) {
    const code = get(`C${r}`);
    const name = get(`D${r}`);
    if (!code || !name) continue;
    students.push({
      rowNumber: r,
      massarId: get(`B${r}`),
      studentCode: code,
      fullName: name,
      birthDate: get(`F${r}`),
      notes: cols.map((c) => parseNote(get(`${c.note}${r}`))),
      absences: cols.map((c) => get(`${c.abs}${r}`)),
    });
  }
  if (students.length === 0) throw new MassarFileError("Aucun élève trouvé dans le fichier.");

  return {
    schoolYear,
    levelLabel,
    className,
    sessionCode,
    sessionLabel,
    teacher: get("O9"),
    establishment: get("O7"),
    massarMeta: {
      cd_etab: get("C5") ?? "",
      id_classe: get("E5") ?? "",
      id_session: sessionCode,
      id_controle_continu: get("I5") ?? "",
      cd_matiere: get("K5") ?? "",
      id_annee: get("M5") ?? "",
      nefstat: get("O5") ?? "",
    },
    students,
  };
}

export type CcExportRow = { rowNumber: number; notes: (number | null)[]; absences: (string | null)[] };

// Rewrites the grade/absence cells of each student row in the original file.
export async function buildMassarCcFile(original: Buffer, rows: CcExportRow[]): Promise<Buffer> {
  const { zip, sheetPath, sheetXml, shared } = await loadParts(original);
  const cells = readCells(sheetXml, shared);
  const cols = controlColumns(cells);
  const prefix = sheetXml.match(/<(\w+):worksheet\b/)?.[1];
  const tag = (name: string) => (prefix ? `${prefix}:${name}` : name);

  const replacements = new Map<string, string>();
  for (const row of rows) {
    cols.forEach((c, i) => {
      for (const [col, kind] of [[c.note, "note"], [c.abs, "abs"]] as const) {
        const ref = `${col}${row.rowNumber}`;
        const existing = cells.get(ref);
        if (!existing) continue;
        const style = attr(existing.raw.match(/^<[^>]*>/)?.[0] ?? "", "s");
        const s = style ? ` s="${style}"` : "";
        let xml: string;
        if (kind === "note") {
          const v = row.notes[i];
          xml = v == null ? `<${tag("c")} r="${ref}"${s} />` : `<${tag("c")} r="${ref}"${s} t="n"><${tag("v")}>${v}</${tag("v")}></${tag("c")}>`;
        } else {
          const v = row.absences[i];
          xml = v ? `<${tag("c")} r="${ref}"${s} t="str"><${tag("v")}>${encode(v)}</${tag("v")}></${tag("c")}>` : `<${tag("c")} r="${ref}"${s} />`;
        }
        replacements.set(existing.raw, xml);
      }
    });
  }

  let out = sheetXml;
  for (const [from, to] of replacements) out = out.replace(from, () => to);
  zip.file(sheetPath, out);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
