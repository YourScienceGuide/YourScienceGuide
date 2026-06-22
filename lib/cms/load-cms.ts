import "server-only";

import { lessonKey } from "@/lib/admin/lesson-key";
import {
  createDefaultStore,
  sanitizeContentStore,
  type AdminContentStore,
  type LessonVideoMeta,
} from "@/lib/admin/content-store";
import {
  payloadToChapterQuestion,
  payloadToAlcumusProblem,
  chapterQuestionToPayload,
  type AlcumusProblemRow,
  type AssignmentQuestionRow,
  type CourseRow,
  type CourseTextbookRow,
  type LessonRow,
  type LessonVideoRow,
} from "@/lib/cms/question-payload";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import type { Textbook } from "@/lib/student/textbook";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import {
  alcumusProblemToChapterQuestion,
} from "@/lib/lesson/chapter-questions";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function cmsHasContent(): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const { count, error } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to check CMS content: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

export async function loadCmsAsStore(): Promise<AdminContentStore> {
  const supabase = createSupabaseAdmin();

  const [
    coursesResult,
    lessonsResult,
    textbooksResult,
    videosResult,
    questionsResult,
    alcumusResult,
  ] = await Promise.all([
    supabase.from("courses").select("*").order("sort_order", { ascending: true }),
    supabase.from("lessons").select("*").order("sort_order", { ascending: true }),
    supabase.from("course_textbooks").select("*"),
    supabase.from("lesson_videos").select("*"),
    supabase.from("assignment_questions").select("*").order("sort_order", { ascending: true }),
    supabase.from("alcumus_problems").select("*"),
  ]);

  for (const result of [
    coursesResult,
    lessonsResult,
    textbooksResult,
    videosResult,
    questionsResult,
    alcumusResult,
  ]) {
    if (result.error) {
      throw new Error(`Failed to load CMS data: ${result.error.message}`);
    }
  }

  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const lesson of (lessonsResult.data ?? []) as LessonRow[]) {
    const list = lessonsByCourse.get(lesson.course_id) ?? [];
    list.push(lesson);
    lessonsByCourse.set(lesson.course_id, list);
  }

  const courses: Course[] = ((coursesResult.data ?? []) as CourseRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description,
    lessons: (lessonsByCourse.get(row.id) ?? []).map(mapLessonRow),
  }));

  const textbooks: Record<string, Textbook> = {};
  for (const row of (textbooksResult.data ?? []) as CourseTextbookRow[]) {
    textbooks[row.course_id] = mapTextbookRow(row);
  }

  const videos: Record<string, LessonVideoMeta> = {};
  for (const row of (videosResult.data ?? []) as LessonVideoRow[]) {
    const meta: LessonVideoMeta = {
      title: row.title,
      description: row.description,
    };
    if (row.mux_playback_id) meta.muxPlaybackId = row.mux_playback_id;
    if (row.file_name) meta.fileName = row.file_name;
    videos[lessonKey(row.course_id, row.lesson_id)] = meta;
  }

  const questionBank: Record<string, ChapterQuestion[]> = {};
  const bankByKey = new Map<string, Map<string, ChapterQuestion>>();

  for (const row of (questionsResult.data ?? []) as AssignmentQuestionRow[]) {
    const key = lessonKey(row.course_id, row.lesson_id);
    const question = payloadToChapterQuestion(row);
    if (!question) continue;
    if (!bankByKey.has(key)) bankByKey.set(key, new Map());
    bankByKey.get(key)!.set(question.id, question);
  }

  for (const row of (alcumusResult.data ?? []) as AlcumusProblemRow[]) {
    const key = lessonKey(row.course_id, row.lesson_id);
    const converted = alcumusProblemToChapterQuestion(payloadToAlcumusProblem(row));
    if (!converted) continue;
    if (!bankByKey.has(key)) bankByKey.set(key, new Map());
    const map = bankByKey.get(key)!;
    if (!map.has(converted.id)) {
      map.set(converted.id, converted);
    }
  }

  for (const [key, map] of bankByKey) {
    questionBank[key] = [...map.values()];
  }

  return sanitizeContentStore({
    version: 3,
    courses,
    questionBank,
    videos,
    textbooks,
  });
}

function mapLessonRow(row: LessonRow): CurriculumLesson {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    chapterTitle: row.chapter_title,
    title: row.title,
    description: row.description,
    order: row.sort_order,
    chapter: row.csv_chapter ?? undefined,
    section: row.csv_section ?? undefined,
  };
}

function mapTextbookRow(row: CourseTextbookRow): Textbook {
  return {
    title: row.title,
    subtitle: row.subtitle,
    authors: row.authors,
    edition: row.edition,
    publisher: row.publisher,
    coverSrc: row.cover_url,
    coverAlt: row.cover_alt,
  };
}

export async function loadLegacyContentBlob(): Promise<AdminContentStore | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("content_store")
    .select("data")
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load legacy content store: ${error.message}`);
  }

  if (!data?.data || typeof data.data !== "object") {
    return null;
  }

  const parsed = data.data as Partial<AdminContentStore>;
  if (!Array.isArray(parsed.courses) || parsed.courses.length === 0) {
    return null;
  }

  return sanitizeContentStore({
    version: parsed.version === 1 ? 1 : parsed.version === 2 ? 2 : 3,
    courses: parsed.courses,
    questionBank: parsed.questionBank ?? {},
    lessonQuestions: parsed.lessonQuestions,
    alcumusByLesson: parsed.alcumusByLesson,
    videos: parsed.videos ?? {},
    textbooks: parsed.textbooks,
  });
}

export async function seedDefaultCms(): Promise<AdminContentStore> {
  const store = createDefaultStore();
  const { saveCmsFromStore } = await import("@/lib/cms/save-cms");
  await saveCmsFromStore(store);
  return store;
}
