"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteExamAttempt(attemptId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_attempts").delete().eq("id", attemptId);
  revalidatePath(`/admin/results/exams/${examId}`);
  revalidatePath("/admin/results");
}

export async function deleteExamAttempts(attemptIds: string[], examId: string) {
  if (attemptIds.length === 0) return;
  const supabase = await createClient();
  await supabase.from("exam_attempts").delete().in("id", attemptIds);
  revalidatePath(`/admin/results/exams/${examId}`);
  revalidatePath("/admin/results");
}
