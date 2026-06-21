import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { SEED_COURSES } from "@/lib/student/curriculum-seed";

export type LessonVideoMeta = {
  title: string;
  description: string;
  /** @deprecated Legacy local data-URL uploads — use muxPlaybackId instead. */
  sourceUrl?: string;
  muxPlaybackId?: string;
  fileName?: string;
};

export type AdminContentStore = {
  version: 1 | 2;
  courses: Course[];
  lessonQuestions: Record<string, LessonQuestion[]>;
  alcumusByLesson: Record<string, AlcumusProblem[]>;
  videos: Record<string, LessonVideoMeta>;
};

/** Client event fired after content is saved or refreshed from the API. */
export const CONTENT_UPDATED_EVENT = "ysg-content-updated";

const CURRENT_STORE_VERSION = 2 as const;

function cloneCourses(): Course[] {
  return JSON.parse(JSON.stringify(SEED_COURSES)) as Course[];
}

function migrateLessonFields(lesson: CurriculumLesson): CurriculumLesson {
  const legacy = lesson as CurriculumLesson & {
    unitId?: string;
    unitTitle?: string;
  };

  const chapterId =
    legacy.chapterId ?? legacy.unitId?.replace(/^unit-/, "chapter-") ?? "chapter-1";
  const legacyTitle = legacy.chapterTitle ?? legacy.unitTitle ?? "Chapter 1";
  const chapterTitle = legacy.unitTitle && !legacy.chapterTitle
    ? legacyTitle.replace(/^Unit\b/i, "Chapter")
    : legacyTitle;

  return {
    ...lesson,
    chapterId,
    chapterTitle,
  };
}

function migrateCourses(courses: Course[]): Course[] {
  return courses.map((course) => ({
    ...course,
    lessons: course.lessons.map(migrateLessonFields),
  }));
}

function stripLegacyVideoBlobs(store: AdminContentStore): AdminContentStore {
  const videos: Record<string, LessonVideoMeta> = {};
  let changed = store.version !== CURRENT_STORE_VERSION;

  for (const [key, video] of Object.entries(store.videos ?? {})) {
    if (video.sourceUrl?.startsWith("data:")) {
      changed = true;
      const { sourceUrl: _removed, ...clean } = video;
      videos[key] = clean;
    } else {
      videos[key] = video;
    }
  }

  if (!changed) return store;
  return { ...store, version: CURRENT_STORE_VERSION, videos };
}

export function createDefaultStore(): AdminContentStore {
  return {
    version: CURRENT_STORE_VERSION,
    courses: cloneCourses(),
    lessonQuestions: {},
    alcumusByLesson: {},
    videos: {},
  };
}

export function sanitizeContentStore(store: AdminContentStore): AdminContentStore {
  return stripLegacyVideoBlobs({
    ...store,
    courses: migrateCourses(store.courses),
  });
}

export function notifyContentUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONTENT_UPDATED_EVENT));
  }
}

export function getCoursesFromStore(store: AdminContentStore): Course[] {
  return store.courses;
}

export function getCourseFromStore(
  store: AdminContentStore,
  courseId: string,
): Course | undefined {
  return store.courses.find((c) => c.id === courseId);
}

export function getLessonFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
) {
  return getCourseFromStore(store, courseId)?.lessons.find((l) => l.id === lessonId);
}

export function getLessonQuestionsFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  seedFallback: LessonQuestion[],
): LessonQuestion[] {
  const key = lessonKey(courseId, lessonId);
  return store.lessonQuestions[key] ?? seedFallback;
}

export function getAlcumusFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  seedFallback: AlcumusProblem[],
): AlcumusProblem[] {
  const key = lessonKey(courseId, lessonId);
  return store.alcumusByLesson[key] ?? seedFallback;
}

export function getVideoFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
) {
  return store.videos[lessonKey(courseId, lessonId)];
}

/** Exact phrase admins must type to confirm course deletion. */
export function courseDeleteConfirmationPhrase(courseTitle: string): string {
  return `delete course ${courseTitle}`;
}

/** Exact phrase admins must type to confirm lesson deletion. */
export function lessonDeleteConfirmationPhrase(lessonTitle: string): string {
  return `delete lesson ${lessonTitle}`;
}

/** Exact phrase admins must type to confirm deleting all assignment questions for a lesson. */
export function assignmentQuestionsDeleteAllPhrase(lessonTitle: string): string {
  return `delete all assignment questions for ${lessonTitle}`;
}

/** Exact phrase admins must type to confirm deleting one assignment question. */
export function assignmentQuestionDeletePhrase(questionNumber: number): string {
  return `delete assignment question ${questionNumber}`;
}

/** Exact phrase admins must type to confirm deleting all extra practice for a lesson. */
export function alcumusProblemsDeleteAllPhrase(lessonTitle: string): string {
  return `delete all extra practice for ${lessonTitle}`;
}

/** Exact phrase admins must type to confirm deleting one extra practice problem. */
export function alcumusProblemDeletePhrase(problemNumber: number): string {
  return `delete extra practice problem ${problemNumber}`;
}

function stripKeysForCourse<T>(
  record: Record<string, T>,
  courseId: string,
): Record<string, T> {
  const prefix = `${courseId}/`;
  const next: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!key.startsWith(prefix)) {
      next[key] = value;
    }
  }
  return next;
}

function stripLessonKey<T>(
  record: Record<string, T>,
  key: string,
): Record<string, T> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

export function removeLessonFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): AdminContentStore {
  const key = lessonKey(courseId, lessonId);
  return {
    ...store,
    courses: store.courses.map((course) =>
      course.id === courseId
        ? { ...course, lessons: course.lessons.filter((lesson) => lesson.id !== lessonId) }
        : course,
    ),
    lessonQuestions: stripLessonKey(store.lessonQuestions, key),
    alcumusByLesson: stripLessonKey(store.alcumusByLesson, key),
    videos: stripLessonKey(store.videos, key),
  };
}

export function removeCourseFromStore(
  store: AdminContentStore,
  courseId: string,
): AdminContentStore {
  return {
    ...store,
    courses: store.courses.filter((course) => course.id !== courseId),
    lessonQuestions: stripKeysForCourse(store.lessonQuestions, courseId),
    alcumusByLesson: stripKeysForCourse(store.alcumusByLesson, courseId),
    videos: stripKeysForCourse(store.videos, courseId),
  };
}
