import "server-only";

import { lessonKey } from "@/lib/admin/lesson-key";
import { type AdminContentStore } from "@/lib/admin/content-store";
import {
  alcumusProblemToPayload,
  lessonQuestionToPayload,
} from "@/lib/cms/question-payload";
import { resolveTextbookCoverUrl } from "@/lib/cms/textbook-covers.server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const now = () => new Date().toISOString();

export async function saveCmsFromStore(store: AdminContentStore): Promise<void> {
  const supabase = createSupabaseAdmin();
  const courseIds = store.courses.map((course) => course.id);
  const timestamp = now();

  await deleteCoursesNotInList(courseIds);

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
    await deleteLessonsNotInList(course.id, lessonIds);

    if (course.lessons.length > 0) {
      const lessonRows = course.lessons.map((lesson, lessonIndex) => ({
        course_id: course.id,
        id: lesson.id,
        chapter_id: lesson.chapterId,
        chapter_title: lesson.chapterTitle,
        title: lesson.title,
        description: lesson.description,
        sort_order: lesson.order ?? lessonIndex + 1,
        csv_chapter: lesson.chapter ?? null,
        csv_section: lesson.section ?? null,
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

    for (const lesson of course.lessons) {
      const key = lessonKey(course.id, lesson.id);
      await syncAssignmentQuestions(course.id, lesson.id, store.lessonQuestions[key] ?? []);
      await syncAlcumusProblems(course.id, lesson.id, store.alcumusByLesson[key] ?? []);
      await syncLessonVideo(course.id, lesson.id, store.videos[key]);
    }
  }
}

async function deleteCoursesNotInList(courseIds: string[]): Promise<void> {
  const supabase = createSupabaseAdmin();
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

async function deleteLessonsNotInList(courseId: string, lessonIds: string[]): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  if (error) {
    throw new Error(`Failed to list lessons for ${courseId}: ${error.message}`);
  }

  const keep = new Set(lessonIds);
  const toDelete = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id));

  for (const lessonId of toDelete) {
    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("course_id", courseId)
      .eq("id", lessonId);

    if (deleteError) {
      throw new Error(`Failed to delete lesson ${lessonId}: ${deleteError.message}`);
    }
  }
}

async function syncAssignmentQuestions(
  courseId: string,
  lessonId: string,
  questions: AdminContentStore["lessonQuestions"][string],
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error: deleteError } = await supabase
    .from("assignment_questions")
    .delete()
    .eq("course_id", courseId)
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw new Error(`Failed to clear assignment questions: ${deleteError.message}`);
  }

  if (!questions?.length) return;

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

  const { error: insertError } = await supabase.from("assignment_questions").insert(rows);
  if (insertError) {
    throw new Error(`Failed to save assignment questions: ${insertError.message}`);
  }
}

async function syncAlcumusProblems(
  courseId: string,
  lessonId: string,
  problems: AdminContentStore["alcumusByLesson"][string],
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error: deleteError } = await supabase
    .from("alcumus_problems")
    .delete()
    .eq("course_id", courseId)
    .eq("lesson_id", lessonId);

  if (deleteError) {
    throw new Error(`Failed to clear Alcumus problems: ${deleteError.message}`);
  }

  if (!problems?.length) return;

  const rows = problems.map((problem) => ({
    course_id: courseId,
    lesson_id: lessonId,
    id: problem.id,
    level: problem.level,
    problem_type: problem.type,
    prompt: problem.prompt,
    hint: problem.hint ?? null,
    payload: alcumusProblemToPayload(problem),
    updated_at: now(),
  }));

  const { error: insertError } = await supabase.from("alcumus_problems").insert(rows);
  if (insertError) {
    throw new Error(`Failed to save Alcumus problems: ${insertError.message}`);
  }
}

async function syncLessonVideo(
  courseId: string,
  lessonId: string,
  video: AdminContentStore["videos"][string] | undefined,
): Promise<void> {
  const supabase = createSupabaseAdmin();

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
