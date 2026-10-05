"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  examFormSchema,
  examModelFormSchema,
  examSectionFormSchema,
  examQuestionFormSchema,
} from "@/schemas/exams";

export type FormState = { error?: string } | undefined;

// ---- EXAMS (parent) -------------------------------------------------------

function toUTCorNull(local: string): string | null {
  if (!local) return null;
  // datetime-local is wall time with no tz; new Date() interprets it as local.
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function upsertExam(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = examFormSchema.safeParse({
    title: formData.get("title"),
    levelId: formData.get("levelId") ?? "",
    durationMinutes: formData.get("durationMinutes") || 60,
    startAt: formData.get("startAt") ?? "",
    endAt: formData.get("endAt") ?? "",
    maxAttempts: formData.get("maxAttempts") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const payload = {
    title: parsed.data.title,
    level_id: parsed.data.levelId || null,
    duration_minutes: parsed.data.durationMinutes,
    start_at: toUTCorNull(parsed.data.startAt || ""),
    end_at: toUTCorNull(parsed.data.endAt || ""),
    max_attempts: parsed.data.maxAttempts,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("exams").update(payload).eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { error } = await supabase.from("exams").insert(payload);
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidatePath("/admin/exams");
  if (id) revalidatePath(`/admin/exams/${id}`);
}

export async function toggleExamPublished(id: string, isPublished: boolean) {
  const supabase = await createClient();
  await supabase.from("exams").update({ is_published: isPublished }).eq("id", id);
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${id}`);
}

export async function toggleExamActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("exams").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${id}`);
}

export async function deleteExam(id: string) {
  const supabase = await createClient();
  await supabase.from("exams").delete().eq("id", id);
  revalidatePath("/admin/exams");
}

// ---- EXAM MODELS (A, B, C, D children) ------------------------------------

export async function createExamModel(
  examId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = examModelFormSchema.safeParse({
    label: formData.get("label"),
    secretCode: formData.get("secretCode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  // Place after the last existing one
  const { data: existing } = await supabase
    .from("exam_models")
    .select("order_index")
    .eq("exam_id", examId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from("exam_models").insert({
    exam_id: examId,
    label: parsed.data.label,
    secret_code: parsed.data.secretCode,
    order_index: nextOrder,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "Ce libellé ou ce code est déjà utilisé." };
    }
    return { error: "Une erreur est survenue." };
  }
  revalidatePath(`/admin/exams/${examId}`);
}

export async function updateExamModel(
  modelId: string,
  examId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = examModelFormSchema.safeParse({
    label: formData.get("label"),
    secretCode: formData.get("secretCode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_models")
    .update({ label: parsed.data.label, secret_code: parsed.data.secretCode })
    .eq("id", modelId);
  if (error) {
    if (error.code === "23505") return { error: "Libellé ou code déjà utilisé." };
    return { error: "Une erreur est survenue." };
  }
  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}

export async function deleteExamModel(modelId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_models").delete().eq("id", modelId);
  revalidatePath(`/admin/exams/${examId}`);
}

// Deep clone a model's sections+questions+options into a brand-new sibling
// model. Useful: author model A, then duplicate to B and tweak a few things.
export async function duplicateExamModel(
  modelId: string,
  examId: string,
  newLabel: string,
  newCode: string
) {
  const supabase = await createClient();
  const { data: src } = await supabase
    .from("exam_models")
    .select("id, order_index")
    .eq("id", modelId)
    .maybeSingle();
  if (!src) return { error: "Modèle source introuvable." };

  // Place after the last one
  const { data: existing } = await supabase
    .from("exam_models")
    .select("order_index")
    .eq("exam_id", examId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { data: newModel, error: insertErr } = await supabase
    .from("exam_models")
    .insert({ exam_id: examId, label: newLabel, secret_code: newCode, order_index: nextOrder })
    .select("id")
    .single();
  if (insertErr || !newModel) {
    if (insertErr?.code === "23505") return { error: "Libellé ou code déjà utilisé." };
    return { error: "Une erreur est survenue." };
  }

  // Copy sections (keep an old→new id map)
  const { data: sections } = await supabase
    .from("exam_sections")
    .select("id, title, image_url, order_index")
    .eq("exam_model_id", src.id)
    .order("order_index");

  const sectionMap = new Map<string, string>();
  if (sections && sections.length > 0) {
    const sectionInserts = sections.map((s) => ({
      exam_model_id: newModel.id,
      title: s.title,
      image_url: s.image_url,
      order_index: s.order_index,
    }));
    const { data: insertedSections } = await supabase
      .from("exam_sections")
      .insert(sectionInserts)
      .select("id, title, order_index");
    insertedSections?.forEach((ins) => {
      const match = sections.find(
        (s) => s.title === ins.title && s.order_index === ins.order_index
      );
      if (match) sectionMap.set(match.id, ins.id);
    });
  }

  // Copy questions
  const { data: questions } = await supabase
    .from("exam_questions")
    .select("id, section_id, question_text, question_type, points, order_index")
    .eq("exam_model_id", src.id)
    .order("order_index");

  const questionMap = new Map<string, string>();
  if (questions && questions.length > 0) {
    const questionInserts = questions.map((q) => ({
      exam_model_id: newModel.id,
      section_id: q.section_id ? sectionMap.get(q.section_id) ?? null : null,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      order_index: q.order_index,
    }));
    const { data: insertedQ } = await supabase
      .from("exam_questions")
      .insert(questionInserts)
      .select("id, question_text, order_index");
    insertedQ?.forEach((ins) => {
      const match = questions.find(
        (q) => q.question_text === ins.question_text && q.order_index === ins.order_index
      );
      if (match) questionMap.set(match.id, ins.id);
    });
  }

  // Copy options
  if (questionMap.size > 0) {
    const { data: options } = await supabase
      .from("exam_options")
      .select("question_id, option_text, is_correct, order_index")
      .in("question_id", Array.from(questionMap.keys()));
    if (options && options.length > 0) {
      await supabase.from("exam_options").insert(
        options
          .map((o) => {
            const newQid = questionMap.get(o.question_id);
            if (!newQid) return null;
            return {
              question_id: newQid,
              option_text: o.option_text,
              is_correct: o.is_correct,
              order_index: o.order_index,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      );
    }
  }

  revalidatePath(`/admin/exams/${examId}`);
  return { newModelId: newModel.id };
}

// ---- EXAM SECTIONS --------------------------------------------------------

export async function upsertExamSection(
  id: string | null,
  modelId: string,
  examId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = examSectionFormSchema.safeParse({
    title: formData.get("title"),
    imageUrl: formData.get("imageUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const payload = {
    title: parsed.data.title,
    image_url: parsed.data.imageUrl || null,
  };
  if (id) {
    const { error } = await supabase.from("exam_sections").update(payload).eq("id", id);
    if (error) return { error: "Une erreur est survenue." };
  } else {
    const { data: existing } = await supabase
      .from("exam_sections")
      .select("order_index")
      .eq("exam_model_id", modelId)
      .order("order_index", { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;
    const { error } = await supabase
      .from("exam_sections")
      .insert({ exam_model_id: modelId, ...payload, order_index: nextOrder });
    if (error) return { error: "Une erreur est survenue." };
  }
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}

export async function deleteExamSection(id: string, modelId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_sections").delete().eq("id", id);
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}

// ---- EXAM QUESTIONS -------------------------------------------------------

// Default option seed per question_type — enough to let the admin start
// filling values without having to construct the right pool from scratch.
function defaultOptionsFor(type: string) {
  if (type === "true_false") {
    return [
      { option_text: "Vrai", is_correct: false, order_index: 0 },
      { option_text: "Faux", is_correct: false, order_index: 1 },
    ];
  }
  if (type === "qcm_single" || type === "qcm_multiple" || type === "matching") {
    return [
      { option_text: "", is_correct: false, order_index: 0 },
      { option_text: "", is_correct: false, order_index: 1 },
    ];
  }
  return []; // fill_blank: the "correct" answer sits as an option with is_correct=true, admin adds it manually
}

export async function createExamQuestion(
  modelId: string,
  sectionId: string | null,
  examId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = examQuestionFormSchema.safeParse({
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    points: formData.get("points") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("exam_questions")
    .select("order_index")
    .eq("exam_model_id", modelId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from("exam_questions")
    .insert({
      exam_model_id: modelId,
      section_id: sectionId,
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
      order_index: nextOrder,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: "Une erreur est survenue." };

  const defaults = defaultOptionsFor(parsed.data.questionType);
  if (defaults.length > 0) {
    await supabase.from("exam_options").insert(defaults.map((d) => ({ ...d, question_id: inserted.id })));
  }
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}

export async function updateExamQuestion(
  id: string,
  modelId: string,
  examId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = examQuestionFormSchema.safeParse({
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    points: formData.get("points") || 1,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_questions")
    .update({
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
    })
    .eq("id", id);
  if (error) return { error: "Une erreur est survenue." };
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}

export async function deleteExamQuestion(id: string, modelId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_questions").delete().eq("id", id);
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}

// ---- EXAM OPTIONS ---------------------------------------------------------

// Options are edited inline from the question panel — one action batches
// the whole option set per question (replaces whatever was there), simpler
// than per-row CRUD and matches how the admin thinks about editing.
export async function replaceExamOptions(
  questionId: string,
  modelId: string,
  examId: string,
  options: { text: string; isCorrect: boolean }[]
) {
  const supabase = await createClient();
  await supabase.from("exam_options").delete().eq("question_id", questionId);
  const cleaned = options
    .map((o, i) => ({
      question_id: questionId,
      option_text: o.text.trim(),
      is_correct: o.isCorrect,
      order_index: i,
    }))
    .filter((o) => o.option_text.length > 0);
  if (cleaned.length > 0) {
    await supabase.from("exam_options").insert(cleaned);
  }
  revalidatePath(`/admin/exams/${examId}/models/${modelId}`);
}
