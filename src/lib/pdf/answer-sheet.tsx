import { Document, Page, View, Text, StyleSheet, Font, Svg, Path } from "@react-pdf/renderer";
import path from "node:path";

// Fixed for this single-school deployment (see devoir-report.tsx for the
// same pattern, Arabic-side) — no home in the schema for 3 values that
// never change, not worth a settings table for.
const INSTITUTION = "IBN BATTOUTA";
const SUBJECT = "Informatique";

const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
Font.register({
  family: "Kalam",
  fonts: [{ src: path.join(FONT_DIR, "Kalam-Bold.ttf"), fontWeight: 700 }],
});
Font.register({
  family: "PatrickHand",
  fonts: [{ src: path.join(FONT_DIR, "PatrickHand-Regular.ttf") }],
});

function currentSchoolYear(): string {
  // Morocco's school year runs Sept→June — before September, we're still
  // in the year that started the previous September. Duplicated from
  // devoir-report.tsx deliberately (separate, unrelated documents — see
  // this project's established "parallel not shared" precedent for
  // exam vs. exercise code) rather than cross-imported.
  const now = new Date();
  const y = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? y : y - 1;
  return `${startYear}/${startYear + 1}`;
}

function getAppreciation(score20: number): string {
  if (score20 >= 18) return "Excellent !";
  if (score20 >= 15) return "Très bien.";
  if (score20 >= 12) return "Bien.";
  if (score20 >= 10) return "Passable.";
  return "Insuffisant.";
}

// @react-pdf/renderer's fonts (Helvetica, Kalam, ...) have no glyph for
// "✓"/"✗" — confirmed empty by a direct render spike before building this —
// so the check/cross marks are drawn as tiny vector strokes instead of relying
// on a Unicode glyph any font here actually has.
function CheckIcon({ color, size = 9 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M 1 5 L 4 8.5 L 9 1" stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}
function CrossIcon({ color, size = 9 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M 1 1 L 9 9 M 9 1 L 1 9" stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

const TEACHER_RED = "#D32F2F";
const TEACHER_GREEN = "#2E7D32";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },

  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 8,
    marginBottom: 14,
  },
  letterCol: { width: "28%" },
  letterColCenter: { width: "44%", alignItems: "center" },
  letterLine: { fontSize: 7, fontWeight: 700, textAlign: "center", marginBottom: 1 },
  letterLineRight: { fontSize: 7, fontWeight: 700, textAlign: "right", marginBottom: 1 },
  examTitle: { fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 3, textAlign: "center" },
  examMeta: { fontSize: 8, fontWeight: 700, textAlign: "center", marginBottom: 1 },

  studentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  studentBox: { borderWidth: 1, borderColor: "#000", padding: 8, width: "60%" },
  studentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  studentLabel: { fontSize: 8, color: "#333" },
  studentVal: { fontFamily: "Helvetica-Bold", fontSize: 10 },

  stampWrapper: { width: 130, alignItems: "center" },
  stamp: {
    borderWidth: 2,
    borderColor: TEACHER_RED,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    transform: "rotate(-4deg)",
  },
  scoreRow: { flexDirection: "row", alignItems: "baseline" },
  scoreVal: { fontFamily: "Kalam", fontSize: 22, fontWeight: 700, color: TEACHER_RED },
  scoreMax: { fontSize: 7, color: "#000", marginLeft: 3 },
  appreciation: {
    fontFamily: "PatrickHand",
    fontSize: 12,
    color: TEACHER_RED,
    marginTop: 4,
    transform: "rotate(-4deg)",
  },

  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: "#f3f4f6",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  question: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  questionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  questionTextWrap: { flex: 1, paddingRight: 8 },
  questionText: { fontWeight: 700 },
  pointsBadge: { fontSize: 8, color: "#555" },
  answerLine: { marginBottom: 2 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  resultText: { fontSize: 9 },
  correctText: { color: TEACHER_GREEN },
  incorrectText: { color: TEACHER_RED },
  note: { fontFamily: "PatrickHand", color: TEACHER_RED, fontSize: 10, marginTop: 2 },
  openNote: { color: "#555555", fontStyle: "italic" },
});

export type AnswerSheetQuestion = {
  questionText: string;
  points: number;
  isCorrect: boolean | null;
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
  studentFirstName: string;
  studentName: string;
  studentNumber: string | null;
  studentClass: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  sections: AnswerSheetSection[];
};

function QuestionBlock({ q, index }: { q: AnswerSheetQuestion; index: number }) {
  return (
    <View style={styles.question} wrap={false}>
      <View style={styles.questionHeader}>
        <View style={styles.questionTextWrap}>
          <Text style={styles.questionText}>
            Q{index + 1}. {q.questionText}
          </Text>
        </View>
        <Text style={styles.pointsBadge}>{q.points} pt</Text>
      </View>
      <Text style={styles.answerLine}>Réponse donnée : {q.answerText || "(vide)"}</Text>
      {q.isCorrect !== null ? (
        <View style={styles.resultRow}>
          {q.isCorrect ? (
            <CheckIcon color={TEACHER_GREEN} />
          ) : (
            <CrossIcon color={TEACHER_RED} />
          )}
          <Text style={[styles.resultText, q.isCorrect ? styles.correctText : styles.incorrectText]}>
            {q.isCorrect ? "Correct" : "Incorrect"} — {q.pointsEarned}/{q.points} pt
          </Text>
        </View>
      ) : (
        <Text style={styles.openNote}>Question ouverte — non notée automatiquement</Text>
      )}
      {q.isCorrect === false && q.correctAnswerTexts.length > 0 ? (
        <Text style={styles.note}>→ Bonne réponse : {q.correctAnswerTexts.join(", ")}</Text>
      ) : null}
    </View>
  );
}

export function AnswerSheetDocument({ data }: { data: AnswerSheetData }) {
  const submittedDate = new Date(data.submittedAt).toLocaleDateString("fr-FR");
  const score20 = data.maxScore > 0 ? (data.score / data.maxScore) * 20 : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.letterhead}>
          <View style={styles.letterCol}>
            <Text style={styles.letterLine}>ROYAUME DU MAROC</Text>
            <Text style={styles.letterLine}>
              Ministère de l&apos;Éducation Nationale, du Préscolaire et des Sports
            </Text>
          </View>
          <View style={styles.letterColCenter}>
            <Text style={styles.examTitle}>{data.examTitle}</Text>
            <Text style={styles.examMeta}>Matière : {SUBJECT}</Text>
            <Text style={styles.examMeta}>Établissement : {INSTITUTION}</Text>
          </View>
          <View style={styles.letterCol}>
            <Text style={styles.letterLineRight}>Année scolaire : {currentSchoolYear()}</Text>
            <Text style={styles.letterLineRight}>Date : {submittedDate}</Text>
          </View>
        </View>

        <View style={styles.studentSection}>
          <View style={styles.studentBox}>
            <View style={styles.studentRow}>
              <Text style={styles.studentLabel}>Nom et Prénom :</Text>
              <Text style={styles.studentVal}>
                {data.studentFirstName} {data.studentName}
              </Text>
            </View>
            {data.studentNumber ? (
              <View style={styles.studentRow}>
                <Text style={styles.studentLabel}>N° :</Text>
                <Text style={styles.studentVal}>{data.studentNumber}</Text>
              </View>
            ) : null}
            {data.studentClass ? (
              <View style={styles.studentRow}>
                <Text style={styles.studentLabel}>Classe :</Text>
                <Text style={styles.studentVal}>{data.studentClass}</Text>
              </View>
            ) : null}
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

        {data.sections.map((section, sIndex) => (
          <View key={sIndex}>
            {section.title ? <Text style={styles.sectionHeader}>{section.title}</Text> : null}
            {section.questions.map((q, i) => (
              <QuestionBlock key={i} q={q} index={i} />
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
