import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import "./fonts";
import { getAppreciation } from "@/lib/grading";
import { NAVY, NAVY_DARK, GOLD, INK_MUTED, TINT, RULE } from "./theme";
import { OfficialHeader } from "./official-header";
import type { PdfLogo } from "./logo";

const SUBJECT = "Informatique";

type Mention = { label: string; color: string; test: (s: number) => boolean };

const MENTIONS: Mention[] = [
  { label: "Excellent", color: "#15803d", test: (s) => s >= 18 },
  { label: "Très bien", color: "#16a34a", test: (s) => s >= 16 && s < 18 },
  { label: "Bien", color: "#2563eb", test: (s) => s >= 14 && s < 16 },
  { label: "Moyen", color: "#9333ea", test: (s) => s >= 10 && s < 14 },
  { label: "Insuffisant", color: "#dc2626", test: (s) => s < 10 },
];
const mentionOf = (s: number) => MENTIONS.find((m) => m.test(s)) ?? MENTIONS[MENTIONS.length - 1];

const MEDALS = ["#c8a03c", "#9aa3b2", "#b0753f"];

const s = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 40, paddingHorizontal: 26, fontFamily: "Cairo", fontSize: 8.5, color: "#1f2937", lineHeight: 1.25 },

  header: { marginBottom: 12 },
  titleBlock: { alignItems: "center", paddingVertical: 5 },
  kicker: { fontWeight: 700, fontSize: 7.5, color: GOLD, letterSpacing: 2 },
  title: { fontWeight: 700, fontSize: 18, color: NAVY, textAlign: "center", lineHeight: 1.2 },

  /* Overview */
  overview: { flexDirection: "row", gap: 8, marginBottom: 8 },
  hero: { width: "34%", backgroundColor: NAVY, borderRadius: 8, padding: 10, alignItems: "center" },
  heroLabel: { fontSize: 7.5, color: "#c9d4ec", letterSpacing: 1 },
  heroValueRow: { flexDirection: "row", alignItems: "baseline" },
  heroValue: { fontWeight: 700, fontSize: 30, color: "#ffffff", lineHeight: 1.45 },
  heroMax: { fontSize: 11, color: "#c9d4ec", marginLeft: 3 },
  heroPill: { marginTop: 12, backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 1 },
  heroPillText: { fontWeight: 700, fontSize: 8, color: NAVY_DARK },

  card: { flex: 1, borderWidth: 0.8, borderColor: RULE, borderRadius: 8, padding: 10, justifyContent: "center" },
  cardLabel: { fontSize: 7.5, color: INK_MUTED, letterSpacing: 1 },
  cardValue: { fontWeight: 700, fontSize: 20, color: NAVY, lineHeight: 1.45 },
  cardSub: { fontSize: 7.5, color: INK_MUTED },
  track: { height: 6, borderRadius: 3, backgroundColor: "#e5e9f2", marginTop: 11, marginBottom: 4 },
  fill: { height: 6, borderRadius: 3, backgroundColor: GOLD },
  splitRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  splitItem: { flex: 1 },
  splitSub: { fontSize: 7.5, color: INK_MUTED, marginTop: 7 },
  splitValue: { fontWeight: 700, fontSize: 16, lineHeight: 1.45 },

  /* Stat tiles */
  tiles: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tile: { flex: 1, flexDirection: "row", borderWidth: 0.8, borderColor: RULE, borderRadius: 6 },
  tileBar: { width: 4, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  tileBody: { paddingVertical: 5, paddingHorizontal: 8 },
  tileLabel: { fontSize: 7, color: INK_MUTED },
  tileValue: { fontWeight: 700, fontSize: 13, color: NAVY, lineHeight: 1.35 },

  /* Panels */
  panels: { flexDirection: "row", gap: 8, marginBottom: 12 },
  panel: { flex: 1, borderWidth: 0.8, borderColor: RULE, borderRadius: 8, padding: 10 },
  panelTitle: { fontWeight: 700, fontSize: 10, color: NAVY, marginBottom: 6 },
  podiumRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  medal: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 6 },
  medalText: { fontWeight: 700, fontSize: 8, color: "#ffffff" },
  podiumName: { flex: 1, fontSize: 8.5 },
  podiumScore: { fontWeight: 700, fontSize: 9.5, color: NAVY },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  barLabel: { width: 52, fontSize: 7.5 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#eef1f6", marginHorizontal: 5 },
  barFill: { height: 8, borderRadius: 4 },
  barCount: { width: 42, fontSize: 7.5, textAlign: "right", color: INK_MUTED },
  empty: { fontSize: 8, color: INK_MUTED },

  /* Student list */
  listTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  listTitle: { fontWeight: 700, fontSize: 11, color: NAVY },
  listRule: { flex: 1, height: 1, backgroundColor: GOLD, marginLeft: 8, marginTop: 5 },
  tables: { flexDirection: "row", gap: 10 },
  table: { flex: 1 },
  th: { flexDirection: "row", backgroundColor: NAVY, borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingVertical: 3 },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff" },
  tr: { flexDirection: "row", alignItems: "center", paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: "#e5e9f2" },
  trAlt: { backgroundColor: TINT },
  cNum: { width: 20, textAlign: "center" },
  cName: { flex: 1, paddingRight: 4 },
  cScore: { width: 32, textAlign: "center" },
  cMention: { width: 58, alignItems: "center" },
  num: { fontFamily: "Helvetica", fontSize: 7.5, color: INK_MUTED },
  name: { fontFamily: "Helvetica", fontSize: 8.5 },
  score: { fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  badge: { borderRadius: 3, paddingTop: 1.8, paddingBottom: 0.8, paddingHorizontal: 4 },
  badgeText: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#ffffff" },

  footer: {
    position: "absolute",
    top: 812,
    left: 26,
    right: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.6,
    borderTopColor: RULE,
    paddingTop: 4,
  },
  footerText: { fontSize: 7, color: INK_MUTED, lineHeight: 1 },
  signature: { marginTop: 10, alignSelf: "flex-end", width: 180, alignItems: "center" },
  signatureLine: { width: "100%", borderBottomWidth: 0.8, borderBottomColor: INK_MUTED, marginTop: 16 },
});

export type ClassReportStudent = { name: string; score: number };

export type ClassReportData = {
  examTitle: string;
  className: string;
  students: ClassReportStudent[];
  absentCount: number;
  schoolYear: string;
  semester: string;
  devoir: string | null;
  logo: PdfLogo;
  settings: {
    teacherName: string;
    academieAr: string;
    directionAr: string;
  };
};

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.tile}>
      <View style={[s.tileBar, { backgroundColor: color }]} />
      <View style={s.tileBody}>
        <Text style={s.tileLabel}>{label}</Text>
        <Text style={s.tileValue}>{value}</Text>
      </View>
    </View>
  );
}

function StudentTable({ rows }: { rows: (ClassReportStudent & { rank: number })[] }) {
  return (
    <View style={s.table}>
      <View style={s.th}>
        <Text style={[s.thText, s.cNum]}>N°</Text>
        <Text style={[s.thText, s.cName]}>Nom et prénom</Text>
        <Text style={[s.thText, s.cScore]}>/20</Text>
        <Text style={[s.thText, s.cMention, { textAlign: "center" }]}>Mention</Text>
      </View>
      {rows.map((st, i) => {
        const m = mentionOf(st.score);
        return (
          <View key={st.rank} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.num, s.cNum]}>{st.rank}</Text>
            <Text style={[s.name, s.cName]}>{st.name}</Text>
            <Text style={[s.score, s.cScore, { color: st.score >= 10 ? NAVY : "#dc2626" }]}>
              {st.score.toFixed(2)}
            </Text>
            <View style={s.cMention}>
              <View style={[s.badge, { backgroundColor: m.color }]}>
                <Text style={s.badgeText}>{m.label}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ClassReportDocument({ data }: { data: ClassReportData }) {
  const scores = data.students.map((st) => st.score);
  const total = data.students.length;
  const passing = scores.filter((sc) => sc >= 10).length;
  const failing = total - passing;
  const average = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const maxScore = total > 0 ? Math.max(...scores) : 0;
  const minScore = total > 0 ? Math.min(...scores) : 0;
  const successRate = total > 0 ? (passing / total) * 100 : 0;

  const sorted = [...data.students].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const half = Math.ceil(sorted.length / 2);
  const colA = sorted.slice(0, half).map((st, i) => ({ ...st, rank: i + 1 }));
  const colB = sorted.slice(half).map((st, i) => ({ ...st, rank: half + i + 1 }));
  const podium = [...data.students].sort((a, b) => b.score - a.score).slice(0, 3);
  const distribution = MENTIONS.map((m) => ({ ...m, count: scores.filter(m.test).length }));
  const printedOn = new Date().toLocaleDateString("fr-FR");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {data.className} · {data.examTitle} · édité le {printedOn}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>

        <View style={s.header}>
          <OfficialHeader
            logo={data.logo}
            academieAr={data.settings.academieAr}
            directionAr={data.settings.directionAr}
            left={[
              { label: "Matière", value: SUBJECT },
              { label: "Année scolaire", value: data.schoolYear },
              { label: "Enseignant(e)", value: data.settings.teacherName },
            ]}
            right={[
              { label: "Classe", value: data.className },
              { label: "Session", value: `Semestre ${data.semester}` },
              { label: "Devoir N°", value: data.devoir },
            ]}
          >
            <View style={s.titleBlock}>
              <Text style={s.kicker}>RAPPORT D&apos;ÉVALUATION</Text>
              <Text style={s.title}>{data.examTitle}</Text>
            </View>
          </OfficialHeader>
        </View>

        {/* Overview */}
        <View style={s.overview}>
          <View style={s.hero}>
            <Text style={s.heroLabel}>MOYENNE DE LA CLASSE</Text>
            <View style={s.heroValueRow}>
              <Text style={s.heroValue}>{average.toFixed(2)}</Text>
              <Text style={s.heroMax}>/ 20</Text>
            </View>
            <View style={s.heroPill}>
              <Text style={s.heroPillText}>{total > 0 ? getAppreciation(average) : "—"}</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>TAUX DE RÉUSSITE</Text>
            <Text style={s.cardValue}>{successRate.toFixed(1)} %</Text>
            <View style={s.track}>
              <View style={[s.fill, { width: `${Math.min(100, successRate)}%` }]} />
            </View>
            <Text style={s.cardSub}>
              {passing} élève{passing > 1 ? "s" : ""} sur {total} avec une note de 10 ou plus
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>PARTICIPATION</Text>
            <View style={s.splitRow}>
              <View style={s.splitItem}>
                <Text style={[s.splitValue, { color: NAVY }]}>{total}</Text>
                <Text style={s.splitSub}>Présents</Text>
              </View>
              <View style={s.splitItem}>
                <Text style={[s.splitValue, { color: data.absentCount > 0 ? "#dc2626" : INK_MUTED }]}>
                  {data.absentCount}
                </Text>
                <Text style={s.splitSub}>Absents</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.tiles}>
          <Tile label="Note la plus haute" value={maxScore.toFixed(2)} color="#16a34a" />
          <Tile label="Note la plus basse" value={minScore.toFixed(2)} color="#dc2626" />
          <Tile label="Reçus (10 et +)" value={String(passing)} color={NAVY} />
          <Tile label="Non reçus" value={String(failing)} color={GOLD} />
        </View>

        {/* Podium + distribution */}
        <View style={s.panels}>
          <View style={s.panel}>
            <Text style={s.panelTitle}>Meilleurs élèves</Text>
            {podium.length === 0 ? (
              <Text style={s.empty}>Aucune copie.</Text>
            ) : (
              podium.map((st, i) => (
                <View key={i} style={s.podiumRow}>
                  <View style={[s.medal, { backgroundColor: MEDALS[i] }]}>
                    <Text style={s.medalText}>{i + 1}</Text>
                  </View>
                  <Text style={s.podiumName}>{st.name}</Text>
                  <Text style={s.podiumScore}>{st.score.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
          <View style={s.panel}>
            <Text style={s.panelTitle}>Répartition des notes</Text>
            {distribution.map((d) => (
              <View key={d.label} style={s.barRow}>
                <Text style={s.barLabel}>{d.label}</Text>
                <View style={s.barTrack}>
                  {d.count > 0 ? (
                    <View
                      style={[s.barFill, { backgroundColor: d.color, width: `${(d.count / Math.max(1, total)) * 100}%` }]}
                    />
                  ) : null}
                </View>
                <Text style={s.barCount}>
                  {d.count} · {total > 0 ? Math.round((d.count / total) * 100) : 0} %
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Student list */}
        <View style={s.listTitleRow}>
          <Text style={s.listTitle}>Liste des élèves</Text>
          <View style={s.listRule} />
        </View>
        <View style={s.tables}>
          <StudentTable rows={colA} />
          {colB.length > 0 ? <StudentTable rows={colB} /> : <View style={s.table} />}
        </View>

        <View style={s.signature} wrap={false}>
          <Text style={s.footerText}>Signature de l&apos;enseignant(e)</Text>
          <View style={s.signatureLine} />
        </View>

      </Page>
    </Document>
  );
}
