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
function CheckIcon({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M 1 5 L 4 8.5 L 9 1" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}
function CrossIcon({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M 1 1 L 9 9 M 9 1 L 1 9" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

const TEACHER_RED = "#D32F2F";
const TEACHER_GREEN = "#2E7D32";

// Everything below is deliberately compact — the whole exam, however many
// questions, has to fit on one A4 page (an explicit requirement, not a nice-
// to-have), so this trades the more spacious Phase-35-v1 layout for tight
// spacing plus a two-column question flow per section (see SectionBlock).
const styles = StyleSheet.create({
  page: { padding: 22, fontSize: 7.5, fontFamily: "Helvetica" },

  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e293b",
    paddingBottom: 4,
    marginBottom: 6,
  },
  letterCol: { width: "28%" },
  letterColCenter: { width: "44%", alignItems: "center" },
  letterLine: { fontSize: 6, fontWeight: 700, textAlign: "center", marginBottom: 0.5 },
  letterLineRight: { fontSize: 6, fontWeight: 700, textAlign: "right", marginBottom: 0.5 },
  examTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 1, textAlign: "center" },
  examMeta: { fontSize: 6.5, fontWeight: 700, textAlign: "center" },

  studentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  studentBox: { borderWidth: 1, borderColor: "#000", padding: 4, width: "62%" },
  studentRow: { flexDirection: "row", justifyContent: "space-between" },
  studentLabel: { fontSize: 6.5, color: "#333" },
  studentVal: { fontFamily: "Helvetica-Bold", fontSize: 8 },

  stampWrapper: { width: 100, alignItems: "center" },
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
  openNote: { color: "#555555", fontStyle: "italic", fontSize: 7 },
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
      <Text style={styles.questionText}>
        Q{index + 1}. {q.questionText} <Text style={styles.pointsBadge}>({q.points} pt)</Text>
      </Text>
      {q.isCorrect !== null ? (
        <View style={styles.resultRow}>
          {q.isCorrect ? <CheckIcon color={TEACHER_GREEN} /> : <CrossIcon color={TEACHER_RED} />}
          <Text style={[styles.resultText, q.isCorrect ? styles.correctText : styles.incorrectText]}>
            {q.answerText || "(vide)"} — {q.pointsEarned}/{q.points} pt
          </Text>
        </View>
      ) : (
        <Text style={styles.openNote}>{q.answerText || "(vide)"} — non noté</Text>
      )}
      {q.isCorrect === false && q.correctAnswerTexts.length > 0 ? (
        <Text style={styles.note}>→ {q.correctAnswerTexts.join(", ")}</Text>
      ) : null}
    </View>
  );
}

// Splits one section's questions into two side-by-side columns (numbered
// continuously — column B continues where column A left off, it doesn't
// restart) so a section with many short questions (true/false, matching)
// takes half the vertical space. A section with very few questions still
// renders fine as an effectively single (mostly empty) second column.
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
            <Text style={styles.examMeta}>Matière : {SUBJECT} — Établissement : {INSTITUTION}</Text>
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
            <View style={styles.studentRow}>
              {data.studentNumber ? (
                <>
                  <Text style={styles.studentLabel}>N° :</Text>
                  <Text style={styles.studentVal}>{data.studentNumber}</Text>
                </>
              ) : (
                <Text> </Text>
              )}
              {data.studentClass ? (
                <>
                  <Text style={styles.studentLabel}>Classe :</Text>
                  <Text style={styles.studentVal}>{data.studentClass}</Text>
                </>
              ) : null}
            </View>
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
          <SectionBlock key={sIndex} section={section} />
        ))}
      </Page>
    </Document>
  );
}
