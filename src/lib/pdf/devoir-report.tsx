import { Document, Page, View, Text, StyleSheet, Font, Svg, Path } from "@react-pdf/renderer";
import path from "node:path";

// These four never change for this deployment (single-school, single-
// teacher platform — see architecture doc) and have no home in the schema,
// so they live here as constants rather than a new admin settings table for
// values that are effectively fixed. Taken verbatim from the reference
// report the admin supplied. Edit here if the school/teacher ever changes.
const TEACHER_NAME = "يوسف هبلة";
const SUBJECT = "المعلوميات";
const ACADEMIE = "مراكش - آسفي";
const DIRECTION = "إقليم قلعة السراغنة";
const INSTITUTION = "ثانوية إبن بطوطة الاعدادية";

const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
Font.register({
  family: "Cairo",
  fonts: [
    { src: path.join(FONT_DIR, "Cairo-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Cairo-Bold.ttf"), fontWeight: 700 },
  ],
});

function currentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  // Morocco's school year runs Sept→June — before September, we're still
  // in the year that started the previous September.
  const startYear = now.getMonth() >= 8 ? y : y - 1;
  return `${startYear}/${startYear + 1}`;
}

type Mention = { label: string; color: string };

// Single scale used everywhere in this report (header badge, donut, list) —
// the reference PDF actually mixes two slightly different scales between
// its donut and its per-student list; using one consistent scale throughout
// is a deliberate simplification, not an oversight.
function getMention(score20: number): Mention {
  if (score20 < 10) return { label: "ضعيف", color: "#dc2626" };
  if (score20 < 14) return { label: "متوسط", color: "#9333ea" };
  if (score20 < 16) return { label: "جيد", color: "#2563eb" };
  if (score20 < 18) return { label: "جيد جدا", color: "#16a34a" };
  return { label: "ممتاز", color: "#15803d" };
}

const MENTION_ORDER: { label: string; color: string; test: (s: number) => boolean }[] = [
  { label: "ضعيف", color: "#dc2626", test: (s) => s < 10 },
  { label: "متوسط", color: "#9333ea", test: (s) => s >= 10 && s < 14 },
  { label: "جيد", color: "#2563eb", test: (s) => s >= 14 && s < 16 },
  { label: "جيد جدا", color: "#16a34a", test: (s) => s >= 16 && s < 18 },
  { label: "ممتاز", color: "#15803d", test: (s) => s >= 18 },
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 359.999) {
    // A full circle can't be expressed as a single arc (start === end) —
    // draw it as two half-arcs instead.
    const mid = startAngle + 180;
    return `${describeSlice(cx, cy, r, startAngle, mid)} ${describeSlice(cx, cy, r, mid, endAngle)}`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Cairo", fontSize: 9, direction: "rtl" },

  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 8,
    marginBottom: 10,
  },
  letterCol: { width: "30%" },
  letterColCenter: { width: "40%", textAlign: "center" },
  letterLine: { fontSize: 8, textAlign: "center", marginBottom: 2 },
  reportTitleRow: { flexDirection: "row", justifyContent: "center", marginBottom: 2 },
  reportTitle: { fontSize: 15, fontWeight: 700 },
  reportSubtitle: { fontSize: 9, color: "#555" },

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
  metaLabel: { fontSize: 8, color: "#555", marginBottom: 2 },
  metaValueRow: { flexDirection: "row", alignItems: "center" },
  metaValueLatin: { fontFamily: "Helvetica", fontSize: 11, fontWeight: 700 },
  metaValueArabic: { fontSize: 11, fontWeight: 700 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  kpiCard: {
    width: "25%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 6,
    alignItems: "center",
  },
  kpiLabel: { fontSize: 7.5, color: "#555", marginBottom: 2 },
  kpiValue: { fontFamily: "Helvetica", fontSize: 13, fontWeight: 700 },

  panelsRow: { flexDirection: "row", marginBottom: 10 },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 3,
  },
  panelTitle: { fontSize: 9, fontWeight: 700, marginBottom: 6, textAlign: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  topName: { fontSize: 8.5, textAlign: "right" },
  topScore: { fontFamily: "Helvetica", fontSize: 8.5, fontWeight: 700 },

  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5, marginLeft: 4 },
  legendLabel: { fontSize: 7.5 },

  listTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textAlign: "center" },
  studentColumns: { flexDirection: "row" },
  studentColumn: { flex: 1, marginHorizontal: 3 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  studentRank: { fontFamily: "Helvetica", fontSize: 8, width: 16, textAlign: "center" },
  studentName: { flex: 1, fontSize: 8.5, textAlign: "right" },
  mentionBadge: {
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    marginLeft: 4,
  },
  mentionBadgeText: { fontSize: 7, color: "#fff" },
  studentScore: { fontFamily: "Helvetica", fontSize: 8.5, fontWeight: 700, width: 30, textAlign: "center" },
});

function MetaBox({ label, value, latin = false }: { label: string; value: string; latin?: boolean }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={latin ? styles.metaValueLatin : styles.metaValueArabic}>{value}</Text>
    </View>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

export type DevoirReportStudent = { name: string; score: number };

export type DevoirReportData = {
  devoirTitle: string;
  sessionLabel: string;
  className: string;
  students: DevoirReportStudent[];
  absentCount: number;
};

export function DevoirReportDocument({ data }: { data: DevoirReportData }) {
  const scores = data.students.map((s) => s.score);
  const total = data.students.length;
  const passing = scores.filter((s) => s >= 10).length;
  const failing = total - passing;
  const average = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const max = total > 0 ? Math.max(...scores) : 0;
  const min = total > 0 ? Math.min(...scores) : 0;
  const successRate = total > 0 ? (passing / total) * 100 : 0;

  const sortedByName = [...data.students].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const half = Math.ceil(sortedByName.length / 2);
  const columnRight = sortedByName.slice(0, half).map((s, i) => ({ ...s, rank: i + 1 }));
  const columnLeft = sortedByName.slice(half).map((s, i) => ({ ...s, rank: half + i + 1 }));

  const topStudents = [...data.students].sort((a, b) => b.score - a.score).slice(0, 4);

  const distribution = MENTION_ORDER.map((m) => ({
    ...m,
    count: scores.filter(m.test).length,
  })).filter((m) => m.count > 0);

  const sweeps = distribution.map((d) => (total > 0 ? (d.count / total) * 360 : 0));
  const cumulativeStart = sweeps.reduce<number[]>((acc, sweep, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + sweeps[i - 1]);
    return acc;
  }, []);
  const slices = distribution.map((d, i) => ({
    ...d,
    path: describeSlice(50, 50, 40, cumulativeStart[i], cumulativeStart[i] + sweeps[i]),
  }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.letterhead}>
          <View style={styles.letterCol}>
            <Text style={[styles.letterLine, { textAlign: "right" }]}>الأكاديمية: {ACADEMIE}</Text>
            <Text style={[styles.letterLine, { textAlign: "right" }]}>المديرية: {DIRECTION}</Text>
            <Text style={[styles.letterLine, { textAlign: "right" }]}>المؤسسة: {INSTITUTION}</Text>
          </View>
          <View style={styles.letterColCenter}>
            <View style={styles.reportTitleRow}>
              <Text style={styles.reportTitle}>{data.devoirTitle} </Text>
              <Text style={styles.reportTitle}>تقرير</Text>
            </View>
            <Text style={styles.reportSubtitle}>Rapport d&apos;Évaluation</Text>
          </View>
          <View style={styles.letterCol}>
            <Text style={styles.letterLine}>المملكة المغربية</Text>
            <Text style={styles.letterLine}>وزارة التربية الوطنية والتعليم الأولي والرياضة</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaBox label="القسم" value={data.className} latin />
          <MetaBox label="الدورة" value={data.sessionLabel} />
          <MetaBox label="المادة" value={SUBJECT} />
          <MetaBox label="الأستاذ(ة)" value={TEACHER_NAME} />
          <MetaBox label="السنة الدراسية" value={currentSchoolYear()} latin />
        </View>

        <View style={styles.kpiGrid}>
          <KpiCard label="عدد التلاميذ" value={String(total)} />
          <KpiCard label="عدد الغائبين" value={String(data.absentCount)} />
          <KpiCard label="الحاصلون على المعدل" value={String(passing)} />
          <KpiCard label="غير الحاصلين" value={String(failing)} />
          <KpiCard label="معدل القسم" value={`${average.toFixed(2)} / 20`} />
          <KpiCard label="أعلى نقطة" value={max.toFixed(2)} />
          <KpiCard label="أدنى نقطة" value={min.toFixed(2)} />
          <KpiCard label="نسبة النجاح" value={`${successRate.toFixed(1)}%`} />
        </View>

        <View style={styles.panelsRow}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>التلاميذ المتفوقون</Text>
            {topStudents.length === 0 ? (
              <Text style={{ fontSize: 8, textAlign: "center", color: "#888" }}>—</Text>
            ) : (
              topStudents.map((s, i) => (
                <View key={i} style={styles.topRow}>
                  <Text style={styles.topScore}>{s.score.toFixed(2)}</Text>
                  <Text style={styles.topName}>{s.name}</Text>
                </View>
              ))
            )}
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>توزيع النقط</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Svg width={70} height={70} viewBox="0 0 100 100">
                {slices.map((s, i) => (
                  <Path key={i} d={s.path} fill={s.color} />
                ))}
              </Svg>
              <View style={{ flex: 1, marginRight: 8 }}>
                {distribution.map((d, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendLabel}>
                      {d.label} ({d.count})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.listTitle}>لائحة التلاميذ</Text>
        <View style={styles.studentColumns}>
          <View style={styles.studentColumn}>
            {columnLeft.map((s) => {
              const mention = getMention(s.score);
              return (
                <View key={s.rank} style={styles.studentRow}>
                  <Text style={styles.studentScore}>{s.score.toFixed(2)}</Text>
                  <View style={[styles.mentionBadge, { backgroundColor: mention.color }]}>
                    <Text style={styles.mentionBadgeText}>{mention.label}</Text>
                  </View>
                  <Text style={styles.studentName}>{s.name}</Text>
                  <Text style={styles.studentRank}>{s.rank}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.studentColumn}>
            {columnRight.map((s) => {
              const mention = getMention(s.score);
              return (
                <View key={s.rank} style={styles.studentRow}>
                  <Text style={styles.studentScore}>{s.score.toFixed(2)}</Text>
                  <View style={[styles.mentionBadge, { backgroundColor: mention.color }]}>
                    <Text style={styles.mentionBadgeText}>{mention.label}</Text>
                  </View>
                  <Text style={styles.studentName}>{s.name}</Text>
                  <Text style={styles.studentRank}>{s.rank}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </Document>
  );
}
