import { Document, Page, View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";

const SUBJECT = "Informatique";

function currentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? y : y - 1;
  return `${startYear}/${startYear + 1}`;
}

type Mention = { label: string; color: string };

function getMention(score20: number): Mention {
  if (score20 < 10) return { label: "Insuffisant", color: "#dc2626" };
  if (score20 < 14) return { label: "Moyen", color: "#9333ea" };
  if (score20 < 16) return { label: "Bien", color: "#2563eb" };
  if (score20 < 18) return { label: "Très Bien", color: "#16a34a" };
  return { label: "Excellent", color: "#15803d" };
}

const MENTION_ORDER: { label: string; color: string; test: (s: number) => boolean }[] = [
  { label: "Insuffisant", color: "#dc2626", test: (s) => s < 10 },
  { label: "Moyen",       color: "#9333ea", test: (s) => s >= 10 && s < 14 },
  { label: "Bien",        color: "#2563eb", test: (s) => s >= 14 && s < 16 },
  { label: "Très Bien",   color: "#16a34a", test: (s) => s >= 16 && s < 18 },
  { label: "Excellent",   color: "#15803d", test: (s) => s >= 18 },
];

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 359.999) {
    const mid = startAngle + 180;
    return `${describeSlice(cx, cy, r, startAngle, mid)} ${describeSlice(cx, cy, r, mid, endAngle)}`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

const s = StyleSheet.create({
  page: { padding: 28, fontFamily: "Helvetica", fontSize: 9 },

  /* ── Letterhead ── */
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 8,
    marginBottom: 10,
  },
  col30: { width: "30%" },
  col40: { width: "40%", alignItems: "center" },
  lineLeft:   { fontSize: 7.5, textAlign: "left",   marginBottom: 2 },
  lineCenter: { fontSize: 7.5, textAlign: "center", marginBottom: 2 },
  lineRight:  { fontSize: 7.5, textAlign: "right",  marginBottom: 2 },
  lineBold: { fontFamily: "Helvetica-Bold" },
  reportTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 2,
  },
  reportSub: { fontSize: 8, textAlign: "center", color: "#555" },

  /* ── Meta boxes ── */
  metaRow: { flexDirection: "row", marginBottom: 10 },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: 6,
    marginHorizontal: 3,
    alignItems: "center",
  },
  metaLabel: { fontSize: 7.5, color: "#555", marginBottom: 2 },
  metaValue: { fontFamily: "Helvetica-Bold", fontSize: 11 },

  /* ── KPI grid ── */
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  kpiCard: {
    width: "25%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 6,
    alignItems: "center",
  },
  kpiLabel: { fontSize: 7.5, color: "#555", marginBottom: 2, textAlign: "center" },
  kpiValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },

  /* ── Panels ── */
  panelsRow: { flexDirection: "row", marginBottom: 10 },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 3,
  },
  panelTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 6, textAlign: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  topName:  { fontSize: 8.5 },
  topScore: { fontFamily: "Helvetica-Bold", fontSize: 8.5 },

  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 4 },
  legendLabel: { fontSize: 7.5 },

  /* ── Student list ── */
  listTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 6, textAlign: "center" },
  columns: { flexDirection: "row" },
  col: { flex: 1, marginHorizontal: 3 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  rank:  { fontFamily: "Helvetica-Bold", fontSize: 8, width: 16, textAlign: "center" },
  name:  { flex: 1, fontSize: 8.5 },
  badge: { borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 4, marginHorizontal: 3 },
  badgeText: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#fff" },
  score: { fontFamily: "Helvetica-Bold", fontSize: 8.5, width: 30, textAlign: "center" },
});

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaBox}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
    </View>
  );
}

export type ClassReportStudent = { name: string; score: number };

export type ClassReportData = {
  examTitle: string;
  className: string;
  students: ClassReportStudent[];
  absentCount: number;
  settings: {
    teacherName: string;
    institution: string;
    academie: string;
    direction: string;
  };
};

export function ClassReportDocument({ data }: { data: ClassReportData }) {
  const scores  = data.students.map((st) => st.score);
  const total   = data.students.length;
  const passing = scores.filter((sc) => sc >= 10).length;
  const failing = total - passing;
  const average = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const maxScore = total > 0 ? Math.max(...scores) : 0;
  const minScore = total > 0 ? Math.min(...scores) : 0;
  const successRate = total > 0 ? (passing / total) * 100 : 0;

  const sorted = [...data.students].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const half   = Math.ceil(sorted.length / 2);
  const colA   = sorted.slice(0, half).map((st, i) => ({ ...st, rank: i + 1 }));
  const colB   = sorted.slice(half).map((st, i) => ({ ...st, rank: half + i + 1 }));

  const top = [...data.students].sort((a, b) => b.score - a.score).slice(0, 4);

  const distribution = MENTION_ORDER.map((m) => ({
    ...m,
    count: scores.filter(m.test).length,
  })).filter((m) => m.count > 0);

  const sweeps = distribution.map((d) => (total > 0 ? (d.count / total) * 360 : 0));
  const starts = sweeps.reduce<number[]>((acc, sw, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + sweeps[i - 1]);
    return acc;
  }, []);
  const slices = distribution.map((d, i) => ({
    ...d,
    path: describeSlice(50, 50, 40, starts[i], starts[i] + sweeps[i]),
  }));

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Letterhead ── */}
        <View style={s.letterhead}>
          <View style={s.col30}>
            <Text style={[s.lineLeft, s.lineBold]}>ROYAUME DU MAROC</Text>
            <Text style={s.lineLeft}>
              Ministère de l&apos;Éducation Nationale,
            </Text>
            <Text style={s.lineLeft}>du Préscolaire et des Sports</Text>
          </View>
          <View style={s.col40}>
            <Text style={s.reportTitle}>Rapport d&apos;évaluation</Text>
            <Text style={[s.reportTitle, { fontSize: 11 }]}>{data.examTitle}</Text>
            <Text style={s.reportSub}>
              Matière : {SUBJECT} — Année scolaire : {currentSchoolYear()}
            </Text>
          </View>
          <View style={s.col30}>
            <Text style={[s.lineRight, s.lineBold]}>Académie : {data.settings.academie}</Text>
            <Text style={[s.lineRight, s.lineBold]}>Direction : {data.settings.direction}</Text>
            <Text style={[s.lineRight, s.lineBold]}>Établissement : {data.settings.institution}</Text>
            <Text style={[s.lineRight, s.lineBold]}>Enseignant(e) : {data.settings.teacherName}</Text>
          </View>
        </View>

        {/* ── Meta ── */}
        <View style={s.metaRow}>
          <MetaBox label="Classe"         value={data.className} />
          <MetaBox label="Matière"        value={SUBJECT} />
          <MetaBox label="Année scolaire" value={currentSchoolYear()} />
          <MetaBox label="Enseignant(e)"  value={data.settings.teacherName} />
        </View>

        {/* ── KPIs ── */}
        <View style={s.kpiGrid}>
          <KpiCard label="Nb. élèves"     value={String(total)} />
          <KpiCard label="Absents"        value={String(data.absentCount)} />
          <KpiCard label="Reçus (≥10)"    value={String(passing)} />
          <KpiCard label="Échoués"        value={String(failing)} />
          <KpiCard label="Moyenne"        value={`${average.toFixed(2)} / 20`} />
          <KpiCard label="Note max."      value={maxScore.toFixed(2)} />
          <KpiCard label="Note min."      value={minScore.toFixed(2)} />
          <KpiCard label="Taux réussite"  value={`${successRate.toFixed(1)} %`} />
        </View>

        {/* ── Panels ── */}
        <View style={s.panelsRow}>
          <View style={s.panel}>
            <Text style={s.panelTitle}>Meilleurs élèves</Text>
            {top.length === 0 ? (
              <Text style={{ fontSize: 8, textAlign: "center", color: "#888" }}>—</Text>
            ) : (
              top.map((st, i) => (
                <View key={i} style={s.topRow}>
                  <Text style={s.topName}>{st.name}</Text>
                  <Text style={s.topScore}>{st.score.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
          <View style={s.panel}>
            <Text style={s.panelTitle}>Répartition des notes</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Svg width={70} height={70} viewBox="0 0 100 100">
                {slices.map((sl, i) => (
                  <Path key={i} d={sl.path} fill={sl.color} />
                ))}
              </Svg>
              <View style={{ flex: 1, marginLeft: 6 }}>
                {distribution.map((d, i) => (
                  <View key={i} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: d.color }]} />
                    <Text style={s.legendLabel}>
                      {d.label} ({d.count})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Student list ── */}
        <Text style={s.listTitle}>Liste des élèves</Text>
        <View style={s.columns}>
          {[colA, colB].map((col, ci) => (
            <View key={ci} style={s.col}>
              {col.map((st) => {
                const m = getMention(st.score);
                return (
                  <View key={st.rank} style={s.row}>
                    <Text style={s.rank}>{st.rank}</Text>
                    <Text style={s.name}>{st.name}</Text>
                    <View style={[s.badge, { backgroundColor: m.color }]}>
                      <Text style={s.badgeText}>{m.label}</Text>
                    </View>
                    <Text style={s.score}>{st.score.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

      </Page>
    </Document>
  );
}
