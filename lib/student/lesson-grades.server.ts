import "server-only";

import type { GradedLessonProgress, LessonScoreBreakdown } from "@/lib/lesson/graded-lesson-machine";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export type LessonGradeRecord = {
  id: string;
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  earnedPoints: number;
  possiblePoints: number;
  percent: number;
  problemsSolved: number;
  graduated: boolean;
  scoreBreakdown: LessonScoreBreakdown;
  updatedAt: string;
};

export type LongAnswerSubmission = {
  id: string;
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  questionId: string;
  promptExcerpt: string;
  answerText: string;
  maxPoints: number;
  parentScore: number | null;
  parentFeedback: string | null;
  gradedAt: string | null;
  createdAt: string;
};

type LessonGradeRow = {
  id: string;
  family_student_id: string;
  course_id: string;
  lesson_id: string;
  earned_points: number;
  possible_points: number;
  percent: number;
  problems_solved: number;
  graduated: boolean;
  score_breakdown: LessonScoreBreakdown;
  updated_at: string;
};

type SubmissionRow = {
  id: string;
  family_student_id: string;
  course_id: string;
  lesson_id: string;
  question_id: string;
  prompt_excerpt: string;
  answer_text: string;
  max_points: number;
  parent_score: number | null;
  parent_feedback: string | null;
  graded_at: string | null;
  created_at: string;
};

function mapGradeRow(row: LessonGradeRow): LessonGradeRecord {
  return {
    id: row.id,
    familyStudentId: row.family_student_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    earnedPoints: row.earned_points,
    possiblePoints: row.possible_points,
    percent: row.percent,
    problemsSolved: row.problems_solved,
    graduated: row.graduated,
    scoreBreakdown: row.score_breakdown,
    updatedAt: row.updated_at,
  };
}

function mapSubmissionRow(row: SubmissionRow): LongAnswerSubmission {
  return {
    id: row.id,
    familyStudentId: row.family_student_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    questionId: row.question_id,
    promptExcerpt: row.prompt_excerpt,
    answerText: row.answer_text,
    maxPoints: row.max_points,
    parentScore: row.parent_score,
    parentFeedback: row.parent_feedback,
    gradedAt: row.graded_at,
    createdAt: row.created_at,
  };
}

export async function upsertLessonGrade(input: {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  earnedPoints: number;
  possiblePoints: number;
  percent: number;
  problemsSolved: number;
  graduated: boolean;
  scoreBreakdown: LessonScoreBreakdown;
  phaseProgress: GradedLessonProgress;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("lesson_grades").upsert(
    {
      family_student_id: input.familyStudentId,
      course_id: input.courseId,
      lesson_id: input.lessonId,
      earned_points: input.earnedPoints,
      possible_points: input.possiblePoints,
      percent: input.percent,
      problems_solved: input.problemsSolved,
      graduated: input.graduated,
      score_breakdown: input.scoreBreakdown,
      phase_progress: input.phaseProgress,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "family_student_id,course_id,lesson_id" },
  );

  if (error) {
    throw new Error(`Failed to save lesson grade: ${error.message}`);
  }
}

export async function listLessonGradesForStudent(
  familyStudentId: string,
  courseId?: string,
): Promise<LessonGradeRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("lesson_grades")
    .select("*")
    .eq("family_student_id", familyStudentId)
    .order("updated_at", { ascending: false });

  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list lesson grades: ${error.message}`);
  }

  return (data ?? []).map((row) => mapGradeRow(row as LessonGradeRow));
}

export async function createLongAnswerSubmission(input: {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  questionId: string;
  promptExcerpt: string;
  answerText: string;
  maxPoints: number;
}): Promise<LongAnswerSubmission> {
  if (!isSupabaseConfigured()) {
    throw new Error("Submissions require Supabase.");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("long_answer_submissions")
    .insert({
      family_student_id: input.familyStudentId,
      course_id: input.courseId,
      lesson_id: input.lessonId,
      question_id: input.questionId,
      prompt_excerpt: input.promptExcerpt,
      answer_text: input.answerText,
      max_points: input.maxPoints,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save submission: ${error.message}`);
  }

  return mapSubmissionRow(data as SubmissionRow);
}

export async function listPendingSubmissionsForStudent(
  familyStudentId: string,
): Promise<LongAnswerSubmission[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("long_answer_submissions")
    .select("*")
    .eq("family_student_id", familyStudentId)
    .is("parent_score", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list submissions: ${error.message}`);
  }

  return (data ?? []).map((row) => mapSubmissionRow(row as SubmissionRow));
}

export async function gradeLongAnswerSubmission(input: {
  submissionId: string;
  parentScore: number;
  parentFeedback?: string;
}): Promise<LongAnswerSubmission> {
  if (!isSupabaseConfigured()) {
    throw new Error("Grading requires Supabase.");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("long_answer_submissions")
    .update({
      parent_score: input.parentScore,
      parent_feedback: input.parentFeedback ?? null,
      graded_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to grade submission: ${error.message}`);
  }

  return mapSubmissionRow(data as SubmissionRow);
}

export async function getSubmissionById(
  submissionId: string,
): Promise<LongAnswerSubmission | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("long_answer_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load submission: ${error.message}`);
  }

  return data ? mapSubmissionRow(data as SubmissionRow) : null;
}
