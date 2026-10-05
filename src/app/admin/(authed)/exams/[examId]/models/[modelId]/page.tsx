import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ModelBuilder, type ModelData } from "@/components/admin/exams/model-builder";

export default async function AdminExamModelBuilderPage({
  params,
}: {
  params: Promise<{ examId: string; modelId: string }>;
}) {
  const { examId, modelId } = await params;
  const supabase = await createClient();

  const [{ data: model }, { data: exam }] = await Promise.all([
    supabase
      .from("exam_models")
      .select("id, label, secret_code, exam_id")
      .eq("id", modelId)
      .maybeSingle(),
    supabase.from("exams").select("id, title").eq("id", examId).maybeSingle(),
  ]);

  if (!model || !exam || model.exam_id !== examId) notFound();

  const [{ data: sections }, { data: questions }, { data: options }] = await Promise.all([
    supabase
      .from("exam_sections")
      .select("id, title, image_url, order_index")
      .eq("exam_model_id", modelId)
      .order("order_index"),
    supabase
      .from("exam_questions")
      .select("id, section_id, question_text, question_type, points, order_index")
      .eq("exam_model_id", modelId)
      .order("order_index"),
    supabase
      .from("exam_options")
      .select("id, question_id, option_text, is_correct, order_index")
      .in(
        "question_id",
        (await supabase
          .from("exam_questions")
          .select("id")
          .eq("exam_model_id", modelId)
        ).data?.map((q) => q.id) ?? ["00000000-0000-0000-0000-000000000000"]
      ),
  ]);

  const data: ModelData = {
    examId,
    modelId,
    examTitle: exam.title,
    modelLabel: model.label,
    secretCode: model.secret_code,
    sections: (sections ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      imageUrl: s.image_url,
      orderIndex: s.order_index,
      questions: (questions ?? [])
        .filter((q) => q.section_id === s.id)
        .map((q) => ({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          points: q.points,
          options: (options ?? [])
            .filter((o) => o.question_id === q.id)
            .sort((a, b) => a.order_index - b.order_index)
            .map((o) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct })),
        })),
    })),
    unsectionedQuestions: (questions ?? [])
      .filter((q) => q.section_id === null)
      .map((q) => ({
        id: q.id,
        text: q.question_text,
        type: q.question_type,
        points: q.points,
        options: (options ?? [])
          .filter((o) => o.question_id === q.id)
          .sort((a, b) => a.order_index - b.order_index)
          .map((o) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct })),
      })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/exams/${examId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Modèles de « {exam.title} »
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Modèle {model.label}</h1>
              <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm font-bold tracking-widest">
                {model.secret_code}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{exam.title}</p>
          </div>
        </div>
      </div>

      <ModelBuilder data={data} />
    </div>
  );
}
