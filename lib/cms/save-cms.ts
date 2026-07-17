import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { lessonKey } from "@/lib/admin/lesson-key";
import type { AdminFlashcard } from "@/lib/lesson/admin-flashcard-types";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import type { AssignmentAlgorithmConfig } from "@/lib/lesson/assignment-algorithm-config";
import { normalizeAssignmentAlgorithm } from "@/lib/lesson/assignment-algorithm-config";
import type { LessonQuestion } from "@/lib/lesson/types";
import { type AdminContentStore } from "@/lib/admin/content-store";
import {
  chapterQuestionToPayload,
  lessonQuestionToPayload,
} from "@/lib/cms/question-payload";
import type { SaveCmsScope } from "@/lib/cms/save-cms-scope";
import { resolveTextbookCoverUrl } from "@/lib/cms/textbook-covers.server";
import { normalizeLessonAccessTier } from "@/lib/student/lesson-access";
import { sortOrderForLesson } from "@/lib/student/lesson-sort";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export type { SaveCmsScope } from "@/lib/cms/save-cms-scope";

const now = () => new Date().toISOString();

export type SaveCmsFromStoreOptions = {
  /**
   * `structure` updates courses, lessons, textbooks, and grading/algorithm
   * config only — skips rewriting question banks, videos, flashcards, and
   * review questions. Used by curriculum / access / grading / algorithm saves.
   */
  scope?: SaveCmsScope;
};

export async function saveCmsFromStore(
  store: AdminContentStore,
  options: SaveCmsFromStoreOptions = {},
): Promise<void> {
  const scope = options.scope ?? "full";
  const supabase = createSupabaseAdmin();
  const courseIds = store.courses.map((course) => course.id);
  const timestamp = now();

  await deleteCoursesNotInList(supabase, courseIds);

  for (let courseIndex = 0; courseIndex < store.courses.length; courseIndex++) {
    const course = store.courses[courseIndex];
    const { error: courseError } = await supabase.from("courses").upsert(
      {
        id: course.id,
        title: course.title,
        subject: course.subject,
        description: course.description,
        sort_order: courseIndex,
        updated_at: timestamp,
      },
      { onConflict: "id" },
    );

    if (courseError) {
      throw new Error(`Failed to save course ${course.id}: ${courseError.message}`);
    }

    const lessonIds = course.lessons.map((lesson) => lesson.id);
    await deleteLessonsNotInList(supabase, course.id, lessonIds);

    if (course.lessons.length > 0) {
      const lessonRows = course.lessons.map((lesson) => ({
        course_id: course.id,
        id: lesson.id,
        chapter_id: lesson.chapterId,
        chapter_title: lesson.chapterTitle,
        title: lesson.title,
        description: lesson.description,
        sort_order: sortOrderForLesson(lesson),
        csv_chapter: lesson.chapter ?? null,
        csv_section: lesson.section ?? null,
        access_tier: normalizeLessonAccessTier(lesson.accessTier, lesson.id),
        graduation_problem_count: lesson.graduationProblemCount ?? null,
        parent_engagement_prompt: lesson.parentEngagementPrompt ?? null,
        free_response_rubric: lesson.freeResponseRubric ?? null,
        updated_at: timestamp,
      }));

      const { error: lessonsError } = await supabase.from("lessons").upsert(lessonRows, {
        onConflict: "course_id,id",
      });

      if (lessonsError) {
        throw new Error(`Failed to save lessons for ${course.id}: ${lessonsError.message}`);
      }
    }

    const textbook = store.textbooks?.[course.id];
    if (textbook) {
      const coverUrl = await resolveTextbookCoverUrl(course.id, textbook.coverSrc);
      const { error: textbookError } = await supabase.from("course_textbooks").upsert(
        {
          course_id: course.id,
          title: textbook.title,
          subtitle: textbook.subtitle,
          authors: textbook.authors,
          edition: textbook.edition,
          publisher: textbook.publisher,
          cover_url: coverUrl,
          cover_alt: textbook.coverAlt,
          updated_at: timestamp,
        },
        { onConflict: "course_id" },
      );

      if (textbookError) {
        throw new Error(`Failed to save textbook for ${course.id}: ${textbookError.message}`);
      }
    } else {
      const { error: deleteTextbookError } = await supabase
        .from("course_textbooks")
        .delete()
        .eq("course_id", course.id);

      if (deleteTextbookError) {
        throw new Error(
          `Failed to remove textbook for ${course.id}: ${deleteTextbookError.message}`,
        );
      }
    }

    await syncCourseGradingConfig(
      supabase,
      course.id,
      store.gradingConfigByCourse?.[course.id],
      store.algorithmConfigByCourse?.[course.id],
    );

    if (scope === "structure") {
      continue;
    }

    await Promise.all(
      course.lessons.map((lesson) => syncLessonContent(supabase, store, course.id, lesson.id)),
    );
  }
}

async function syncLessonContent(
  supabase: SupabaseClient,
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): Promise<void> {
  const key = lessonKey(courseId, lessonId);
  await Promise.all([
    syncChapterQuestionBank(supabase, courseId, lessonId, store.questionBank[key] ?? []),
    syncLessonVideo(supabase, courseId, lessonId, store.videos[key]),
    syncLessonFlashcards(supabase, courseId, lessonId, store.flashcardsByLesson?.[key] ?? []),
    syncLessonReviewQuestions(
      supabase,
      courseId,
      lessonId,
      store.reviewQuestionsByLesson?.[key] ?? [],
    ),
  ]);
}

async function deleteCoursesNotInList(
  supabase: SupabaseClient,
  courseIds: string[],
): Promise<void> {
  const { data: existing, error } = await supabase.from("courses").select("id");

  if (error) {
    throw new Error(`Failed to list courses for cleanup: ${error.message}`);
  }

  const keep = new Set(courseIds);
  const toDelete = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id));

  if (toDelete.length === 0) return;

  const { error: deleteError } = await supabase.from("courses").delete().in("id", toDelete);
  if (deleteError) {
    throw new Error(`Failed to delete removed courses: ${deleteError.message}`);
  }
}

async function deleteLessonsNotInList(
  supabase: SupabaseClient,
  courseId: string,
  lessonIds: string[],
): Promise<void> {
  const { data: existing, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  if (error) {
    throw new Error(`Failed to list lessons for ${courseId}: ${error.message}`);
  }

  const keep = new Set(lessonIds);
  const toDelete = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id));

  if (toDelete.length === 0) return;

  const { error: deleteError } = await supabase
    .from("lessons")
    .delete()
    .eq("course_id", courseId)
    .in("id", toDelete);

  if (deleteError) {
    throw new Error(`Failed to delete removed lessons: ${deleteError.message}`);
  }
}

async function syncChapterQuestionBank(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string,
  questions: AdminContentStore["questionBank"][string],
): Promise<void> {
  const { error: deleteAssignmentError } = await supabase
    .from("assignment_questions")
    .delete()
    .eq("course_id", courseId)
    .eq("lesson_id", lessonId);

  if (deleteAssignmentError) {
    throw new Error(`Failed to clear chapter questions: ${deleteAssignmentError.message}`);
  }

  const { error: deleteAlcumusError } = await supabase
    .from("alcumus_problems")
    .delete()
    .eq("course_id", courseId)
    .eq("lesson_id", lessonId);

  if (deleteAlcumusError) {
    throw new Error(`Failed to clear legacy Alcumus rows: ${deleteAlcumusError.message}`);
  }

  if (!questions?.length) return;

  const rows = questions.map((question, index) => ({
    course_id: courseId,
    lesson_id: lessonId,
    question_id: question.id,
    sort_order: index,
    question_type: question.type,
    prompt: question.prompt,
    payload: chapterQuestionToPayload(question),
    updated_at: now(),
  }));

  const { error: insertError } = await supabase.from("assignment_questions").insert(rows);
  if (insertError) {
    throw new Error(`Failed to save chapter questions: ${insertError.message}`);
  }
}

async function syncLessonFlashcards(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string,
  flashcards: AdminFlashcard[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("lesson_flashcards")
    .delete()
    .eq("course_id", courseId)
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw new Error(`Failed to clear lesson flashcards: ${deleteError.message}`);
  }

  if (!flashcards.length) return;

  const rows = flashcards.map((card, index) => ({
    course_id: courseId,
    lesson_id: lessonId,
    card_id: card.id,
    term: card.term,
    sort_order: index,
    updated_at: now(),
  }));

  const { error: insertError } = await supabase.from("lesson_flashcards").insert(rows);
  if (insertError) {
    throw new Error(`Failed to save lesson flashcards: ${insertError.message}`);
  }
}

async function syncCourseGradingConfig(
  supabase: SupabaseClient,
  courseId: string,
  config: GradingRubricConfig | undefined,
  algorithm?: AssignmentAlgorithmConfig | undefined,
): Promise<void> {
  if (!config) {
    const { error } = await supabase
      .from("course_grading_config")
      .delete()
      .eq("course_id", courseId);
    if (error) {
      throw new Error(`Failed to clear grading config for ${courseId}: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("course_grading_config").upsert(
    {
      course_id: courseId,
      review_count: config.reviewCount,
      review_points_each: config.reviewPointsEach,
      mc_bank_size: config.mcBankSize,
      mc_target_correct: config.mcTargetCorrect,
      mc_points_each: config.mcPointsEach,
      fib_count: config.fibCount,
      fib_points_each: config.fibPointsEach,
      extra_count: config.extraCount,
      extra_points_each: config.extraPointsEach,
      free_response_count: config.freeResponseCount,
      free_response_points: config.freeResponsePoints,
      default_graduation_problem_count: config.defaultGraduationProblemCount,
      algorithm_config: normalizeAssignmentAlgorithm(algorithm),
      updated_at: now(),
    },
    { onConflict: "course_id" },
  );

  if (error) {
    throw new Error(`Failed to save grading config for ${courseId}: ${error.message}`);
  }
}

async function syncLessonReviewQuestions(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string,
  questions: LessonQuestion[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("lesson_review_questions")
    .delete()
    .eq("course_id", courseId)
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw new Error(`Failed to clear lesson review questions: ${deleteError.message}`);
  }

  if (!questions.length) return;

  const rows = questions.map((question, index) => ({
    course_id: courseId,
    lesson_id: lessonId,
    question_id: question.id,
    sort_order: index,
    question_type: question.type,
    prompt: question.prompt,
    payload: lessonQuestionToPayload(question),
    updated_at: now(),
  }));

  const { error: insertError } = await supabase.from("lesson_review_questions").insert(rows);
  if (insertError) {
    throw new Error(`Failed to save lesson review questions: ${insertError.message}`);
  }
}

async function syncLessonVideo(
  supabase: SupabaseClient,
  courseId: string,
  lessonId: string,
  video: AdminContentStore["videos"][string] | undefined,
): Promise<void> {
  if (!video) {
    const { error } = await supabase
      .from("lesson_videos")
      .delete()
      .eq("course_id", courseId)
      .eq("lesson_id", lessonId);

    if (error) {
      throw new Error(`Failed to remove lesson video: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("lesson_videos").upsert(
    {
      course_id: courseId,
      lesson_id: lessonId,
      title: video.title,
      description: video.description,
      mux_playback_id: video.muxPlaybackId ?? null,
      file_name: video.fileName ?? null,
      updated_at: now(),
    },
    { onConflict: "course_id,lesson_id" },
  );

  if (error) {
    throw new Error(`Failed to save lesson video: ${error.message}`);
  }
}

export async function resetCmsToDefault(store: AdminContentStore): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { data: existing, error } = await supabase.from("courses").select("id");

  if (error) {
    throw new Error(`Failed to list courses for reset: ${error.message}`);
  }

  if (existing && existing.length > 0) {
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .in(
        "id",
        existing.map((row) => row.id),
      );

    if (deleteError) {
      throw new Error(`Failed to reset CMS courses: ${deleteError.message}`);
    }
  }

  await saveCmsFromStore(store);
}
