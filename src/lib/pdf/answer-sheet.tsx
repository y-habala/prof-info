import { Document, Page, View, Text, StyleSheet, Font, Svg, Path, Polygon, Image } from "@react-pdf/renderer";
import path from "node:path";
import { scoreOutOf20, getAppreciation } from "@/lib/grading";
import { NAVY, NAVY_DARK, GOLD, INK_MUTED, TINT, RULE } from "./theme";

const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");

Font.register({
  family: "Kalam",
  fonts: [{ src: path.join(FONT_DIR, "Kalam-Bold.ttf"), fontWeight: 700 }],
});
Font.register({
  family: "PatrickHand",
  fonts: [{ src: path.join(FONT_DIR, "PatrickHand-Regular.ttf") }],
});
Font.register({
  family: "Cairo",
  fonts: [
    { src: path.join(FONT_DIR, "Cairo-Regular.ttf") },
    { src: path.join(FONT_DIR, "Cairo-Bold.ttf"), fontWeight: 700 },
  ],
});

const SUBJECT = "Informatique";

// School year of the sitting itself, not of the day the PDF is printed.
function schoolYearOf(dateIso: string): string {
  const d = new Date(dateIso);
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 8 ? y : y - 1;
  return `${startYear}/${startYear + 1}`;
}

// "3APIC" / "3 APIC" → "3ème année collégiale"; anything else is shown as is.
function levelLabel(name: string | null): string {
  if (!name) return "—";
  const n = name.match(/\d/)?.[0];
  if (!n) return name;
  return n === "1" ? "1ère année collégiale" : `${n}ème année collégiale`;
}

const TEACHER_RED = "#D32F2F";
const TEACHER_GREEN = "#2E7D32";

// Helvetica/Kalam have no ✓/✗ glyphs — draw as tiny SVG strokes instead.
function CheckIcon({ color = TEACHER_GREEN, size = 7 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M 1 5 L 4 8.5 L 9 1" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}
function CrossIcon({ color = TEACHER_RED, size = 7 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M 1 1 L 9 9 M 9 1 L 1 9" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, fontSize: 7.5, fontFamily: "Helvetica" },

  // Official exam header: one outer frame, a 3-cell top row
  // (school info | logo + Arabic lines | student), then the title ribbon.
  header: { borderWidth: 1.2, borderColor: NAVY, borderRadius: 6, marginBottom: 10 },
  accentBar: {
    height: 4,
    backgroundColor: NAVY,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  accentGold: { height: 1.5, backgroundColor: GOLD },
  headerTop: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: RULE },
  cell: { paddingVertical: 7, paddingHorizontal: 8, justifyContent: "center" },
  cellLeft: { width: "31%", borderRightWidth: 0.8, borderRightColor: RULE },
  cellCenter: { width: "38%", alignItems: "center", borderRightWidth: 0.8, borderRightColor: RULE },
  cellRight: { width: "31%", backgroundColor: TINT },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  infoDot: { width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: GOLD, marginRight: 4 },
  infoLine: { fontFamily: "Times-Italic", fontSize: 8.5, color: INK_MUTED },
  infoValue: { fontFamily: "Times-BoldItalic", color: NAVY },
  logo: { maxHeight: 40, maxWidth: "100%", objectFit: "contain" },
  centerRule: { width: 70, height: 1, backgroundColor: GOLD, marginVertical: 3 },
  arLine: { fontFamily: "Cairo", fontWeight: 700, fontSize: 8, color: NAVY, textAlign: "center", lineHeight: 1.3 },
  arLineSmall: { fontFamily: "Cairo", fontWeight: 700, fontSize: 7, color: INK_MUTED, textAlign: "center", lineHeight: 1.3 },
  studentLine: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 5,
    paddingBottom: 1.5,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
    borderBottomStyle: "dashed",
  },
  studentLabel: { fontFamily: "Times-BoldItalic", fontSize: 10.5, color: NAVY },
  studentVal: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginLeft: 5, flexShrink: 1 },
  dots: { fontSize: 8, marginLeft: 5 },

  headerBottom: { flexDirection: "row", alignItems: "center", paddingVertical: 5, paddingHorizontal: 8 },
  ribbonSide: { width: 105 },
  ribbonWrap: { flex: 1, alignItems: "center" },
  ribbon: { width: 310, height: 30, position: "relative" },
  ribbonText: {
    position: "absolute",
    top: 7,
    left: 26,
    right: 26,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#ffffff",
    letterSpacing: 0.3,
  },

  stampWrapper: { width: 105, alignItems: "center" },
  stamp: {
    borderWidth: 1.5,
    borderColor: TEACHER_RED,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "center",
    transform: "rotate(-4deg)",
  },
  scoreRow: { flexDirection: "row", alignItems: "baseline" },
  scoreVal: { fontFamily: "Kalam", fontSize: 15, fontWeight: 700, color: TEACHER_RED },
  scoreMax: { fontSize: 6, color: "#000", marginLeft: 2 },
  appreciation: {
    fontFamily: "PatrickHand",
    fontSize: 8,
    color: TEACHER_RED,
    marginTop: 1,
    transform: "rotate(-4deg)",
  },

  sectionHeader: {
    fontSize: 8,
    fontWeight: 700,
    backgroundColor: "#f3f4f6",
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginTop: 5,
    marginBottom: 3,
  },
  columnsRow: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  question: { marginBottom: 3, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: "#eeeeee" },
  questionText: { fontWeight: 700, fontSize: 7.5 },
  pointsBadge: { fontSize: 6, color: "#555" },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 3, flexWrap: "wrap" },
  resultText: { fontSize: 7 },
  correctText: { color: TEACHER_GREEN },
  incorrectText: { color: TEACHER_RED },
  note: { fontFamily: "PatrickHand", color: TEACHER_RED, fontSize: 7.5, marginTop: 0.5 },
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
  /** Logo bytes fetched by the route; null when unset or unreachable. */
  logo: { data: Buffer; format: "png" | "jpg" } | null;
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
  };
};

function Ribbon({ text }: { text: string }) {
  return (
    <View style={styles.ribbon}>
      <Svg width={310} height={30} viewBox="0 0 310 30">
        {/* Notched tails behind the band, with a dark fold where they meet it */}
        <Polygon points="0,9 42,9 42,29 0,29 10,19" fill={NAVY_DARK} />
        <Polygon points="310,9 268,9 268,29 310,29 300,19" fill={NAVY_DARK} />
        <Polygon points="26,24 42,24 42,29" fill="#050b1a" />
        <Polygon points="284,24 268,24 268,29" fill="#050b1a" />
        <Polygon points="26,2 284,2 284,24 26,24" fill={NAVY} />
        <Path d="M 30 4.6 L 280 4.6 M 30 21.4 L 280 21.4" stroke={GOLD} strokeWidth={0.7} />
      </Svg>
      <Text style={styles.ribbonText}>{text}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoDot} />
      <Text style={styles.infoLine}>
        {label} : <Text style={styles.infoValue}>{value}</Text>
      </Text>
    </View>
  );
}

function StudentField({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.studentLine}>
      <Text style={styles.studentLabel}>{label} :</Text>
      {value && value.trim() ? (
        <Text style={styles.studentVal}>{value}</Text>
      ) : (
        <Text style={styles.dots}> </Text>
      )}
    </View>
  );
}

function QuestionBlock({ q, index }: { q: AnswerSheetQuestion; index: number }) {
  return (
    <View style={styles.question} wrap={false}>
      <Text style={styles.questionText}>
        Q{index + 1}. {q.questionText} <Text style={styles.pointsBadge}>({q.points} pt)</Text>
      </Text>
      <View style={styles.resultRow}>
        {q.isCorrect ? <CheckIcon /> : <CrossIcon />}
        <Text style={[styles.resultText, q.isCorrect ? styles.correctText : styles.incorrectText]}>
          {q.answerText || "(vide)"} — {q.pointsEarned}/{q.points} pt
        </Text>
      </View>
      {!q.isCorrect && q.correctAnswerTexts.length > 0 ? (
        <Text style={styles.note}>Réponse : {q.correctAnswerTexts.join(", ")}</Text>
      ) : null}
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

  return (
    <View>
      {section.title ? <Text style={styles.sectionHeader}>{section.title}</Text> : null}
      <View style={styles.columnsRow}>
        <View style={styles.column}>
          {left.map((q, i) => (
            <QuestionBlock key={i} q={q} index={i} />
          ))}
        </View>
        {right.length > 0 ? (
          <View style={styles.column}>
            {right.map((q, i) => (
              <QuestionBlock key={i} q={q} index={half + i} />
            ))}
          </View>
        ) : null}
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
          <View style={styles.accentBar} />
          <View style={styles.accentGold} />
          <View style={styles.headerTop}>
            <View style={[styles.cell, styles.cellLeft]}>
              <InfoLine label="Etablissement" value={`${data.settings.institution}.`} />
              <InfoLine label="Matière" value={`${SUBJECT}.`} />
              <InfoLine label="Niveau" value={`${levelLabel(data.levelName)}.`} />
              <InfoLine label="Année scolaire" value={schoolYearOf(data.submittedAt)} />
            </View>

            <View style={[styles.cell, styles.cellCenter]}>
              {data.logo ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
                <Image style={styles.logo} src={data.logo} />
              ) : null}
              {data.settings.academieAr || data.settings.directionAr ? (
                <View style={styles.centerRule} />
              ) : null}
              {data.settings.academieAr ? (
                <Text style={styles.arLine}>{data.settings.academieAr}</Text>
              ) : null}
              {data.settings.directionAr ? (
                <Text style={styles.arLineSmall}>{data.settings.directionAr}</Text>
              ) : null}
            </View>

            <View style={[styles.cell, styles.cellRight]}>
              <StudentField label="Nom" value={fullName} />
              <StudentField label="Classe" value={data.studentClass} />
              <StudentField label="N°" value={data.studentNumber} />
            </View>
          </View>

          <View style={styles.headerBottom}>
            <View style={styles.ribbonSide} />
            <View style={styles.ribbonWrap}>
              <Ribbon text={`${data.examTitle} - ${data.modelLabel.toUpperCase()}`} />
            </View>
            <View style={styles.stampWrapper}>
              <View style={styles.stamp}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreVal}>{score20.toFixed(2)}</Text>
                  <Text style={styles.scoreMax}>sur 20</Text>
                </View>
              </View>
              <Text style={styles.appreciation}>{getAppreciation(score20)}</Text>
            </View>
          </View>
        </View>

        {data.sections.map((section, sIndex) => (
          <SectionBlock key={sIndex} section={section} />
        ))}
      </Page>
    </Document>
  );
}
