"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteExamAttempt(attemptId: string, examId: string) {
  const supabase = await createClient();
  await supabase.from("exam_attempts").delete().eq("id", attemptId);
  revalidatePath(`/admin/results/exams/${examId}`);
  revalidatePath("/admin/results");
}

export async function deleteExerciseAttempt(attemptId: string, exerciseId: string) {
  const supabase = await createClient();
  await supabase.from("exercise_attempts").delete().eq("id", attemptId);
  revalidatePath(`/admin/results/exercises/${exerciseId}`);
  revalidatePath("/admin/results");
}
