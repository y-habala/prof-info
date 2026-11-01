import { Document, Page, View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import "./fonts";
import { scoreOutOf20, getAppreciation } from "@/lib/grading";
import { NAVY, INK_MUTED, TINT, RULE } from "./theme";
import { OfficialHeader } from "./official-header";
import { schoolYearOf, type PdfLogo } from "./logo";

const SUBJECT = "Informatique";

// "3APIC" / "3 APIC" → "3ème année collégiale"; anything else is shown as is.
function levelLabel(name: string | null): string {
  if (!name) return "—";
  const n = name.match(/\d/)?.[0];
  if (!n) return name;
  return n === "1" ? "1ère année collégiale" : `${n}ème année collégiale`;
}

// Everything the "teacher" writes is in one red pen, in Caveat, so the
// correction reads as hand-marked on top of the printed copy.
const PEN = "#d1202f";
const INK = "#1f2937";

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

// Pen strokes drawn as curves (Caveat has no ✓/✗ glyphs, and straight
// lines look printed).
function PenCheck({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path d="M 1.5 7.5 Q 3.5 9 5.5 12.5 Q 8.5 5 13 1.2" stroke={PEN} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function PenCross({ size = 10 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path d="M 2 2.5 Q 7 7.5 12.5 12.5 M 12 1.5 Q 6.5 7 1.8 12.8" stroke={PEN} strokeWidth={1.7} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
// Loose, slightly open double loop around the final mark.
function PenCircle() {
  return (
    <View style={{ position: "absolute", top: 0, left: 0 }}>
    <Svg width={72} height={34} viewBox="0 0 118 52">
      <Path
        d="M 70 4 C 30 1 4 10 5 27 C 6 44 40 50 70 48 C 100 46 116 36 113 22 C 110 9 86 3 58 6"
        stroke={PEN}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
    </View>
  );
}
function PenArrow() {
  return (
    <Svg width={12} height={8} viewBox="0 0 12 8">
      <Path d="M 1 4.5 Q 6 3.5 10.5 4 M 7.5 1.2 L 10.8 4 L 7.3 6.8" stroke={PEN} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function PenUnderline({ width }: { width: number }) {
  return (
    <Svg width={width} height={6} viewBox={`0 0 ${width} 6`}>
      <Path d={`M 2 3.5 Q ${width / 2} 1 ${width - 2} 3`} stroke={PEN} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: { paddingVertical: 20, paddingHorizontal: 22, fontSize: 7.5, fontFamily: "Lato", color: INK },

  header: { marginBottom: 4 },

  markCircle: { width: 72, height: 34, alignItems: "center", justifyContent: "center" },
  markRow: { flexDirection: "row", alignItems: "flex-end" },
  markVal: { fontFamily: "Caveat", fontWeight: 700, fontSize: 20, color: PEN },
  markMax: { fontFamily: "Caveat", fontWeight: 700, fontSize: 10, color: PEN, marginLeft: 1, marginBottom: 3 },
  appreciation: { fontFamily: "Caveat", fontWeight: 700, fontSize: 11, color: PEN, transform: "rotate(-5deg)" },

  section: { marginTop: 5 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TINT,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    paddingVertical: 2,
    paddingLeft: 6,
    paddingRight: 6,
    marginBottom: 3,
  },
  sectionTitle: { flex: 1, fontFamily: "Lato", fontWeight: 700, fontSize: 10.5, color: NAVY },
  sectionMark: { fontFamily: "Caveat", fontWeight: 700, fontSize: 14, color: PEN, marginLeft: 8 },

  columnsRow: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },

  question: {
    flexDirection: "row",
    marginBottom: 2,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    borderBottomStyle: "dotted",
  },
  qBody: { flex: 1 },
  qText: { fontWeight: 700, fontSize: 7.5, color: INK },
  qNum: { color: NAVY, fontWeight: 900 },
  qPts: { fontWeight: 400, fontSize: 6, color: INK_MUTED },
  // Answer, pen mark and correction share one line to keep 20+ questions on a page.
  answerRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 1 },
  answerLabel: { fontSize: 6.5, color: INK_MUTED, marginRight: 3 },
  answer: { fontSize: 7.5, color: "#374151", marginRight: 3 },
  correctionRow: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 6 },
  correction: { fontFamily: "Caveat", fontWeight: 700, fontSize: 11, color: PEN },

  qMark: { width: 18, alignItems: "flex-end", justifyContent: "flex-start" },
  qMarkText: { fontFamily: "Caveat", fontWeight: 700, fontSize: 13, color: PEN },
});

export type AnswerSheetQuestion = {
  questionText: string;
  points: number;
  isCorrect: boolean;
  pointsEarned: number;
  answerText: string;
  correctAnswerTexts: string[];
};

export type AnswerSheetSection = {
  title: string | null;
  questions: AnswerSheetQuestion[];
};

export type AnswerSheetData = {
  examTitle: string;
  modelLabel: string;
  levelName: string | null;
  logo: PdfLogo;
  studentFirstName: string;
  studentName: string;
  studentNumber: string | null;
  studentClass: string | null;
  score: number;
  maxScore: number;
  submittedAt: string;
  sections: AnswerSheetSection[];
  settings: {
    institution: string;
    academie: string;
    direction: string;
    academieAr: string;
    directionAr: string;
    teacherName: string;
    /** "" = derive from the submission date. */
    schoolYear: string;
    /** Per-level override of the printed level label. */
    levelLabels: Record<string, string>;
  };
};

function QuestionBlock({ q, index }: { q: AnswerSheetQuestion; index: number }) {
  return (
    <View style={styles.question} wrap={false}>
      <View style={styles.qBody}>
        <Text style={styles.qText}>
          <Text style={styles.qNum}>{index + 1}. </Text>
          {q.questionText} <Text style={styles.qPts}>({fmt(q.points)} pt)</Text>
        </Text>
        <View style={styles.answerRow}>
          <Text style={styles.answerLabel}>Réponse :</Text>
          <Text style={styles.answer}>{q.answerText || "—"}</Text>
          {q.isCorrect ? <PenCheck size={9} /> : <PenCross size={8} />}
          {!q.isCorrect && q.correctAnswerTexts.length > 0 ? (
            <View style={styles.correctionRow}>
              <PenArrow />
              <Text style={styles.correction}>{q.correctAnswerTexts.join(", ")}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.qMark}>
        <Text style={styles.qMarkText}>{fmt(q.pointsEarned)}</Text>
      </View>
    </View>
  );
}

// Each section splits its questions into two columns — continuous
// numbering (left runs 1..half, right picks up from half+1). Keeps dense
// exams on one A4 page.
function SectionBlock({ section }: { section: AnswerSheetSection }) {
  const half = Math.ceil(section.questions.length / 2);
  const left = section.questions.slice(0, half);
  const right = section.questions.slice(half);
  const earned = section.questions.reduce((s, q) => s + q.pointsEarned, 0);
  const total = section.questions.reduce((s, q) => s + q.points, 0);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead} wrap={false}>
        <Text style={styles.sectionTitle}>{section.title ?? "Questions"}</Text>
        <Text style={styles.sectionMark}>
          {fmt(earned)} / {fmt(total)}
        </Text>
      </View>
      <View style={styles.columnsRow}>
        <View style={styles.column}>
          {left.map((q, i) => (
            <QuestionBlock key={i} q={q} index={i} />
          ))}
        </View>
        <View style={styles.column}>
          {right.map((q, i) => (
            <QuestionBlock key={i} q={q} index={half + i} />
          ))}
        </View>
      </View>
    </View>
  );
}

export function AnswerSheetDocument({ data }: { data: AnswerSheetData }) {
  const score20 = scoreOutOf20(data.score, data.maxScore);
  const fullName = `${data.studentFirstName} ${data.studentName}`.trim();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <OfficialHeader
            logo={data.logo}
            academieAr={data.settings.academieAr}
            directionAr={data.settings.directionAr}
            title={`${data.examTitle} - ${data.modelLabel.toUpperCase()}`}
            aside={
              <View style={{ alignItems: "center" }}>
                <View style={styles.markCircle}>
                  <PenCircle />
                  <View style={styles.markRow}>
                    <Text style={styles.markVal}>{fmt(score20)}</Text>
                    <Text style={styles.markMax}>/20</Text>
                  </View>
                </View>
                <Text style={styles.appreciation}>{getAppreciation(score20)}</Text>
                <PenUnderline width={50} />
              </View>
            }
            left={[
              { label: "Etablissement", value: `${data.settings.institution}.` },
              { label: "Matière", value: `${SUBJECT}.` },
              { label: "Niveau", value: `${(data.levelName && data.settings.levelLabels[data.levelName]) || levelLabel(data.levelName)}.` },
              { label: "Année scolaire", value: data.settings.schoolYear || schoolYearOf(new Date(data.submittedAt)) },
            ]}
            right={[
              { label: "Nom", value: fullName },
              { label: "Classe", value: data.studentClass },
              { label: "N°", value: data.studentNumber },
            ]}
          />
        </View>

        {data.sections.map((section, sIndex) => (
          <SectionBlock key={sIndex} section={section} />
        ))}
      </Page>
    </Document>
  );
}
