import "server-only";

import type { GradedLessonProgress } from "@/lib/lesson/graded-lesson-machine";
import {
  digestToTemplateVariables,
  type LessonDigestActivity,
  type NewFlashcardDefinition,
  type ParentDailyDigest,
  type PendingFreeResponse,
  sectionCountsFromPhaseProgress,
} from "@/lib/email/parent-daily-digest";
import { getParentDisplayName } from "@/lib/auth/parent-email.server";
import type { FamilyStudentRow } from "@/lib/family/format-student";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

type LessonRow = {
  course_id: string;
  id: string;
  title: string;
  csv_chapter: number | null;
  csv_section: number | null;
  parent_engagement_prompt: string | null;
  free_response_rubric: string | null;
};

type LessonGradeRow = {
  course_id: string;
  lesson_id: string;
  phase_progress: GradedLessonProgress | null;
  updated_at: string;
};

type SubmissionRow = {
  id: string;
  course_id: string;
  lesson_id: string;
  prompt_excerpt: string;
  answer_text: string;
  max_points: number;
  created_at: string;
};

type FlashcardEventRow = {
  is_correct: boolean;
};

type FlashcardDefinitionRow = {
  course_id: string;
  lesson_id: string;
  front_text: string;
  definition: string;
  updated_at: string;
};

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function gradeUrlForSubmission(
  familyStudentId: string,
  submissionId: string,
): string {
  const params = new URLSearchParams({
    familyStudentId,
    submissionId,
  });
  return `${appBaseUrl()}/parent/progress?${params.toString()}`;
}

function startOfDayIso(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function endOfDayIso(date: Date): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function buildParentDailyDigest(input: {
  student: FamilyStudentRow;
  parentClerkUserId: string;
  forDate?: Date;
}): Promise<ParentDailyDigest | null> {
  if (!isSupabaseConfigured()) return null;

  const forDate = input.forDate ?? new Date();
  const supabase = createSupabaseAdmin();
  const dayStart = startOfDayIso(forDate);
  const dayEnd = endOfDayIso(forDate);

  const [
    parentName,
    gradesResult,
    submissionsResult,
    flashcardEventsResult,
    flashcardDefinitionsResult,
  ] = await Promise.all([
    getParentDisplayName(input.parentClerkUserId),
    supabase
      .from("lesson_grades")
      .select("course_id, lesson_id, phase_progress, updated_at")
      .eq("family_student_id", input.student.id)
      .gte("updated_at", dayStart)
      .lte("updated_at", dayEnd),
    supabase
      .from("long_answer_submissions")
      .select(
        "id, course_id, lesson_id, prompt_excerpt, answer_text, max_points, created_at",
      )
      .eq("family_student_id", input.student.id)
      .is("parent_score", null)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .order("created_at", { ascending: false }),
    supabase
      .from("flashcard_study_events")
      .select("is_correct")
      .eq("family_student_id", input.student.id)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),
    supabase
      .from("flashcard_student_definitions")
      .select("course_id, lesson_id, front_text, definition, updated_at")
      .eq("family_student_id", input.student.id)
      .gte("updated_at", dayStart)
      .lte("updated_at", dayEnd),
  ]);

  if (gradesResult.error) {
    throw new Error(`Failed to load lesson grades: ${gradesResult.error.message}`);
  }
  if (submissionsResult.error) {
    throw new Error(`Failed to load submissions: ${submissionsResult.error.message}`);
  }
  if (flashcardEventsResult.error) {
    throw new Error(
      `Failed to load flashcard events: ${flashcardEventsResult.error.message}`,
    );
  }
  if (flashcardDefinitionsResult.error) {
    throw new Error(
      `Failed to load flashcard definitions: ${flashcardDefinitionsResult.error.message}`,
    );
  }

  const gradeRows = (gradesResult.data ?? []) as LessonGradeRow[];
  const lessonKeys = new Set<string>();
  for (const row of gradeRows) {
    lessonKeys.add(`${row.course_id}/${row.lesson_id}`);
  }
  for (const row of (submissionsResult.data ?? []) as SubmissionRow[]) {
    lessonKeys.add(`${row.course_id}/${row.lesson_id}`);
  }
  for (const row of (flashcardDefinitionsResult.data ?? []) as FlashcardDefinitionRow[]) {
    lessonKeys.add(`${row.course_id}/${row.lesson_id}`);
  }

  const lessonMeta = new Map<string, LessonRow>();
  if (lessonKeys.size > 0) {
    const { data: lessonRows, error } = await supabase.from("lessons").select(
      "course_id, id, title, csv_chapter, csv_section, parent_engagement_prompt, free_response_rubric",
    );
    if (error) {
      throw new Error(`Failed to load lessons: ${error.message}`);
    }
    for (const row of (lessonRows ?? []) as LessonRow[]) {
      lessonMeta.set(`${row.course_id}/${row.id}`, row);
    }
  }

  const lessons: LessonDigestActivity[] = gradeRows.map((row) => {
    const key = `${row.course_id}/${row.lesson_id}`;
    const meta = lessonMeta.get(key);
    const counts = sectionCountsFromPhaseProgress(row.phase_progress ?? undefined);
    return {
      courseId: row.course_id,
      lessonId: row.lesson_id,
      chapter: meta?.csv_chapter ?? 0,
      section: meta?.csv_section ?? 0,
      lessonTitle: meta?.title ?? row.lesson_id,
      ...counts,
      parentEngagementPrompt: meta?.parent_engagement_prompt ?? "",
      freeResponseRubric: meta?.free_response_rubric ?? "",
    };
  });

  const flashcardEvents = (flashcardEventsResult.data ?? []) as FlashcardEventRow[];
  const flashcardCorrect = flashcardEvents.filter((event) => event.is_correct).length;
  const flashcardAttempted = flashcardEvents.length;

  const pendingFreeResponses: PendingFreeResponse[] = (
    (submissionsResult.data ?? []) as SubmissionRow[]
  ).map((submission) => {
    const key = `${submission.course_id}/${submission.lesson_id}`;
    const meta = lessonMeta.get(key);
    return {
      submissionId: submission.id,
      courseId: submission.course_id,
      lessonId: submission.lesson_id,
      prompt: submission.prompt_excerpt,
      answerText: submission.answer_text,
      maxPoints: submission.max_points,
      rubricText: meta?.free_response_rubric?.trim() || "See course materials.",
      gradeUrl: gradeUrlForSubmission(input.student.id, submission.id),
    };
  });

  const newFlashcards: NewFlashcardDefinition[] = (
    (flashcardDefinitionsResult.data ?? []) as FlashcardDefinitionRow[]
  ).map((row) => ({
    courseId: row.course_id,
    lessonId: row.lesson_id,
    front: row.front_text,
    studentBack: row.definition,
  }));

  const hasActivity =
    lessons.length > 0 ||
    flashcardAttempted > 0 ||
    pendingFreeResponses.length > 0 ||
    newFlashcards.length > 0;

  if (!hasActivity) {
    return null;
  }

  return {
    parentName,
    studentName: input.student.display_name,
    dateLabel: formatDateLabel(forDate),
    lessons,
    flashcardCorrect,
    flashcardAttempted,
    pendingFreeResponses,
    newFlashcards,
  };
}

export function digestTemplateVariables(digest: ParentDailyDigest) {
  return digestToTemplateVariables(digest);
}

export async function listFamilyStudentsForDailyEmail(): Promise<FamilyStudentRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("family_students")
    .select("*")
    .eq("email_on_lesson_complete", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list family students: ${error.message}`);
  }

  return (data ?? []) as FamilyStudentRow[];
}

export async function wasDailyEmailSent(
  familyStudentId: string,
  sentOn: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("parent_daily_email_log")
    .select("id")
    .eq("family_student_id", familyStudentId)
    .eq("sent_on", sentOn)
    .eq("status", "sent")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check email log: ${error.message}`);
  }

  return Boolean(data);
}

export async function logDailyEmailResult(input: {
  parentClerkUserId: string;
  familyStudentId: string;
  sentOn: string;
  status: "sent" | "skipped" | "failed";
  errorMessage?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("parent_daily_email_log").upsert(
    {
      parent_clerk_user_id: input.parentClerkUserId,
      family_student_id: input.familyStudentId,
      sent_on: input.sentOn,
      status: input.status,
      error_message: input.errorMessage ?? null,
    },
    { onConflict: "family_student_id,sent_on" },
  );

  if (error) {
    throw new Error(`Failed to log daily email: ${error.message}`);
  }
}
