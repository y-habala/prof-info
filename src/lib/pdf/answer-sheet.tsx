import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555555", marginBottom: 16 },
  infoRow: { flexDirection: "row", marginBottom: 4 },
  infoLabel: { width: 90, color: "#555555" },
  infoValue: { fontWeight: 700 },
  scoreBox: {
    marginTop: 12,
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
  },
  scoreText: { fontSize: 16, fontWeight: 700 },
  question: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  questionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  questionText: { fontWeight: 700, marginBottom: 4 },
  answerLine: { marginBottom: 2 },
  correct: { color: "#15803d" },
  incorrect: { color: "#b91c1c" },
  correctAnswerLine: { color: "#555555", fontStyle: "italic" },
});

export type AnswerSheetData = {
  examTitle: string;
  studentFirstName: string;
  studentName: string;
  studentClass: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  questions: {
    questionText: string;
    points: number;
    isCorrect: boolean | null;
    pointsEarned: number;
    answerText: string;
    correctAnswerTexts: string[];
  }[];
};

export function AnswerSheetDocument({ data }: { data: AnswerSheetData }) {
  const submittedDate = new Date(data.submittedAt).toLocaleString("fr-FR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.examTitle}</Text>
        <Text style={styles.subtitle}>Feuille de réponses</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Élève</Text>
          <Text style={styles.infoValue}>
            {data.studentFirstName} {data.studentName}
          </Text>
        </View>
        {data.studentClass ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Classe</Text>
            <Text style={styles.infoValue}>{data.studentClass}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Soumis le</Text>
          <Text style={styles.infoValue}>{submittedDate}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            Score : {data.score} / {data.maxScore} ({data.percentage} %)
          </Text>
        </View>

        {data.questions.map((q, i) => (
          <View key={i} style={styles.question} wrap={false}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionText}>
                Q{i + 1}. {q.questionText}
              </Text>
              <Text>{q.points} pt</Text>
            </View>
            <Text style={styles.answerLine}>Réponse donnée : {q.answerText || "(vide)"}</Text>
            {q.isCorrect !== null ? (
              <Text style={q.isCorrect ? styles.correct : styles.incorrect}>
                {q.isCorrect ? "Correct" : "Incorrect"} — {q.pointsEarned}/{q.points} pt
              </Text>
            ) : (
              <Text style={styles.correctAnswerLine}>Question ouverte — non notée automatiquement</Text>
            )}
            {q.isCorrect === false && q.correctAnswerTexts.length > 0 ? (
              <Text style={styles.correctAnswerLine}>Bonne réponse : {q.correctAnswerTexts.join(", ")}</Text>
            ) : null}
          </View>
        ))}
      </Page>
    </Document>
  );
}
