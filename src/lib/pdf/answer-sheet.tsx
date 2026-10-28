import { Document, Page, View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import "./fonts";
import { scoreOutOf20, getAppreciation } from "@/lib/grading";
import { NAVY, TINT } from "./theme";
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
  page: { paddingVertical: 24, paddingHorizontal: 26, fontSize: 7.5, fontFamily: "Helvetica" },

  header: { marginBottom: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 8 },
  titleSide: { width: 105 },
  title: {
    flex: 1,
    fontFamily: "Cairo",
    fontWeight: 700,
    fontSize: 20,
    color: NAVY,
    textAlign: "center",
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
    fontFamily: "Cairo",
    fontWeight: 700,
    fontSize: 9,
    color: NAVY,
    backgroundColor: TINT,
    paddingVertical: 2,
    paddingHorizontal: 6,
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
  };
};

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
          <OfficialHeader
            logo={data.logo}
            academieAr={data.settings.academieAr}
            directionAr={data.settings.directionAr}
            left={[
              { label: "Etablissement", value: `${data.settings.institution}.` },
              { label: "Matière", value: `${SUBJECT}.` },
              { label: "Niveau", value: `${levelLabel(data.levelName)}.` },
              { label: "Année scolaire", value: schoolYearOf(new Date(data.submittedAt)) },
            ]}
            right={[
              { label: "Nom", value: fullName },
              { label: "Classe", value: data.studentClass },
              { label: "N°", value: data.studentNumber },
            ]}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleSide} />
              <Text style={styles.title}>
                {data.examTitle} - {data.modelLabel.toUpperCase()}
              </Text>
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
          </OfficialHeader>
        </View>

        {data.sections.map((section, sIndex) => (
          <SectionBlock key={sIndex} section={section} />
        ))}
      </Page>
    </Document>
  );
}
