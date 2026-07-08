import "server-only";

import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export async function recordFlashcardStudyEvent(input: {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  cardId: string;
  frontText: string;
  isCorrect: boolean;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("flashcard_study_events").insert({
    family_student_id: input.familyStudentId,
    course_id: input.courseId,
    lesson_id: input.lessonId,
    card_id: input.cardId,
    front_text: input.frontText,
    is_correct: input.isCorrect,
  });

  if (error) {
    throw new Error(`Failed to record flashcard study event: ${error.message}`);
  }
}

export async function upsertFlashcardDefinition(input: {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  cardId: string;
  frontText: string;
  definition: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("flashcard_student_definitions").upsert(
    {
      family_student_id: input.familyStudentId,
      course_id: input.courseId,
      lesson_id: input.lessonId,
      card_id: input.cardId,
      front_text: input.frontText,
      definition: input.definition,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "family_student_id,course_id,lesson_id,card_id",
    },
  );

  if (error) {
    throw new Error(`Failed to save flashcard definition: ${error.message}`);
  }
}
