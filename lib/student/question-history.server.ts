import "server-only";



import {

  type QuestionAttemptRecord,

  type QuestionAttemptSummary,

  type RecordQuestionAttemptInput,

  summarizeAttempts,

} from "@/lib/student/question-history.types";

import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";



type QuestionAttemptRow = {

  id: string;

  student_user_id: string;

  family_student_id: string | null;

  course_id: string;

  lesson_id: string;

  question_id: string;

  activity: string;

  question_type: string;

  prompt_excerpt: string;

  is_correct: boolean;

  created_at: string;

};



function mapRow(row: QuestionAttemptRow): QuestionAttemptRecord | null {

  if (!row.family_student_id) return null;



  return {

    id: row.id,

    familyStudentId: row.family_student_id,

    courseId: row.course_id,

    lessonId: row.lesson_id,

    questionId: row.question_id,

    activity: row.activity as QuestionAttemptRecord["activity"],

    questionType: row.question_type,

    promptExcerpt: row.prompt_excerpt,

    isCorrect: row.is_correct,

    createdAt: row.created_at,

  };

}



export type QuestionAttemptQuery = {

  familyStudentId: string;

  courseId?: string;

  lessonId?: string;

  limit?: number;

};



export async function listQuestionAttempts(

  query: QuestionAttemptQuery,

): Promise<QuestionAttemptRecord[]> {

  if (!isSupabaseConfigured()) return [];



  const supabase = createSupabaseAdmin();

  let request = supabase

    .from("question_attempts")

    .select("*")

    .eq("family_student_id", query.familyStudentId)

    .order("created_at", { ascending: false })

    .limit(query.limit ?? 100);



  if (query.courseId) {

    request = request.eq("course_id", query.courseId);

  }

  if (query.lessonId) {

    request = request.eq("lesson_id", query.lessonId);

  }



  const { data, error } = await request;

  if (error) {

    throw new Error(`Failed to load question attempts: ${error.message}`);

  }



  return (data ?? [])

    .map((row) => mapRow(row as QuestionAttemptRow))

    .filter((attempt): attempt is QuestionAttemptRecord => attempt !== null);

}



export async function getQuestionAttemptSummary(

  query: QuestionAttemptQuery,

): Promise<QuestionAttemptSummary> {

  const attempts = await listQuestionAttempts({ ...query, limit: 500 });

  return summarizeAttempts(attempts);

}



export async function insertQuestionAttempt(

  parentClerkUserId: string,

  familyStudentId: string,

  input: RecordQuestionAttemptInput,

): Promise<QuestionAttemptRecord> {

  if (!isSupabaseConfigured()) {

    throw new Error("Supabase is not configured");

  }



  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase

    .from("question_attempts")

    .insert({

      student_user_id: parentClerkUserId,

      family_student_id: familyStudentId,

      course_id: input.courseId,

      lesson_id: input.lessonId,

      question_id: input.questionId,

      activity: input.activity,

      question_type: input.questionType,

      prompt_excerpt: input.promptExcerpt,

      is_correct: input.isCorrect,

    })

    .select("*")

    .single();



  if (error || !data) {

    throw new Error(`Failed to save question attempt: ${error?.message ?? "Unknown error"}`);

  }



  const mapped = mapRow(data as QuestionAttemptRow);

  if (!mapped) {

    throw new Error("Failed to save question attempt");

  }



  return mapped;

}



export async function listQuestionAttemptsForParent(

  parentClerkUserId: string,

  options?: { courseId?: string; lessonId?: string; limit?: number },

): Promise<QuestionAttemptRecord[]> {

  if (!isSupabaseConfigured()) return [];



  const supabase = createSupabaseAdmin();

  let request = supabase

    .from("question_attempts")

    .select("*")

    .eq("student_user_id", parentClerkUserId)

    .not("family_student_id", "is", null)

    .order("created_at", { ascending: false })

    .limit(options?.limit ?? 100);



  if (options?.courseId) {

    request = request.eq("course_id", options.courseId);

  }

  if (options?.lessonId) {

    request = request.eq("lesson_id", options.lessonId);

  }



  const { data, error } = await request;

  if (error) {

    throw new Error(`Failed to load question attempts: ${error.message}`);

  }



  return (data ?? [])

    .map((row) => mapRow(row as QuestionAttemptRow))

    .filter((attempt): attempt is QuestionAttemptRecord => attempt !== null);

}



export async function getQuestionAttemptSummaryForParent(

  parentClerkUserId: string,

  options?: { courseId?: string; lessonId?: string },

): Promise<QuestionAttemptSummary> {

  const attempts = await listQuestionAttemptsForParent(parentClerkUserId, {
    ...options,
    limit: 500,
  });

  return summarizeAttempts(attempts);

}

