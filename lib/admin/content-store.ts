import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import { mergeLegacyQuestionBank } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { SEED_COURSES } from "@/lib/student/curriculum-seed";
import { SEED_TEXTBOOKS, type Textbook } from "@/lib/student/textbook";

export type LessonVideoMeta = {
  title: string;
  description: string;
  /** @deprecated Legacy local data-URL uploads — use muxPlaybackId instead. */
  sourceUrl?: string;
  muxPlaybackId?: string;
  fileName?: string;
};

export type AdminContentStore = {
  version: 1 | 2 | 3;
  courses: Course[];
  /** Unified chapter question bank keyed by courseId/lessonId. */
  questionBank: Record<string, ChapterQuestion[]>;
  /** @deprecated Migrated into questionBank on load. */
  lessonQuestions?: Record<string, LessonQuestion[]>;
  /** @deprecated Migrated into questionBank on load. */
  alcumusByLesson?: Record<string, AlcumusProblem[]>;
  videos: Record<string, LessonVideoMeta>;
  /** Companion textbooks keyed by course id. */
  textbooks?: Record<string, Textbook>;
};

const CURRENT_STORE_VERSION = 3 as const;

/** Client event fired after content is saved or refreshed from the API. */
export const CONTENT_UPDATED_EVENT = "ysg-content-updated";

function normalizeQuestionBank(store: AdminContentStore): Record<string, ChapterQuestion[]> {
  const hasLegacy =
    Boolean(store.lessonQuestions && Object.keys(store.lessonQuestions).length > 0) ||
    Boolean(store.alcumusByLesson && Object.keys(store.alcumusByLesson).length > 0);

  if (store.questionBank && Object.keys(store.questionBank).length > 0) {
    return store.questionBank;
  }

  if (!hasLegacy) {
    return store.questionBank ?? {};
  }

  const keys = new Set([
    ...Object.keys(store.lessonQuestions ?? {}),
    ...Object.keys(store.alcumusByLesson ?? {}),
  ]);

  const questionBank: Record<string, ChapterQuestion[]> = {};
  for (const key of keys) {
    questionBank[key] = mergeLegacyQuestionBank(
      store.lessonQuestions?.[key],
      store.alcumusByLesson?.[key],
    );
  }

  return questionBank;
}

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

function ensureTextbooks(store: AdminContentStore): AdminContentStore {
  if (store.textbooks !== undefined) {
    return store;
  }
  return { ...store, textbooks: { ...SEED_TEXTBOOKS } };
}

export function createDefaultStore(): AdminContentStore {
  return {
    version: CURRENT_STORE_VERSION,
    courses: cloneCourses(),
    questionBank: {},
    videos: {},
    textbooks: { ...SEED_TEXTBOOKS },
  };
}

export function sanitizeContentStore(store: AdminContentStore): AdminContentStore {
  const questionBank = normalizeQuestionBank(store);
  return ensureTextbooks(
    stripLegacyVideoBlobs({
      ...store,
      version: CURRENT_STORE_VERSION,
      courses: migrateCourses(store.courses),
      questionBank,
      lessonQuestions: undefined,
      alcumusByLesson: undefined,
    }),
  );
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

export function getQuestionBankFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): ChapterQuestion[] {
  const key = lessonKey(courseId, lessonId);
  return store.questionBank[key] ?? [];
}

/** @deprecated Use getQuestionBankFromStore and chapter split helpers. */
export function getLessonQuestionsFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  seedFallback: LessonQuestion[],
): LessonQuestion[] {
  const bank = getQuestionBankFromStore(store, courseId, lessonId);
  if (bank.length > 0) {
    return bank.filter((q) => q.difficulty <= 2).map(({ difficulty: _d, ...q }) => q);
  }
  return seedFallback;
}

/** @deprecated Use getQuestionBankFromStore and chapter split helpers. */
export function getAlcumusFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  seedFallback: AlcumusProblem[],
): AlcumusProblem[] {
  const bank = getQuestionBankFromStore(store, courseId, lessonId);
  if (bank.length > 0) return [];
  return seedFallback;
}

export function getVideoFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
) {
  return store.videos[lessonKey(courseId, lessonId)];
}

export function getTextbookFromStore(
  store: AdminContentStore,
  courseId: string,
): Textbook | undefined {
  return store.textbooks?.[courseId];
}

export function setTextbookInStore(
  store: AdminContentStore,
  courseId: string,
  textbook: Textbook,
): AdminContentStore {
  return {
    ...store,
    textbooks: {
      ...(store.textbooks ?? {}),
      [courseId]: textbook,
    },
  };
}

export function removeTextbookFromStore(
  store: AdminContentStore,
  courseId: string,
): AdminContentStore {
  const textbooks = { ...(store.textbooks ?? {}) };
  delete textbooks[courseId];
  return { ...store, textbooks };
}

/** Exact phrase admins must type to confirm course deletion. */
export function courseDeleteConfirmationPhrase(courseTitle: string): string {
  return `delete course ${courseTitle}`;
}

/** Exact phrase admins must type to confirm lesson deletion. */
export function lessonDeleteConfirmationPhrase(lessonTitle: string): string {
  return `delete lesson ${lessonTitle}`;
}

/** Exact phrase admins must type to confirm deleting all chapter questions for a lesson. */
export function chapterQuestionsDeleteAllPhrase(lessonTitle: string): string {
  return `delete all chapter questions for ${lessonTitle}`;
}

/** Exact phrase admins must type to confirm deleting one chapter question. */
export function chapterQuestionDeletePhrase(questionNumber: number): string {
  return `delete chapter question ${questionNumber}`;
}

/** @deprecated Use chapterQuestionsDeleteAllPhrase */
export function assignmentQuestionsDeleteAllPhrase(lessonTitle: string): string {
  return chapterQuestionsDeleteAllPhrase(lessonTitle);
}

/** @deprecated Use chapterQuestionDeletePhrase */
export function assignmentQuestionDeletePhrase(questionNumber: number): string {
  return chapterQuestionDeletePhrase(questionNumber);
}

/** @deprecated Extra practice is derived from the chapter bank. */
export function alcumusProblemsDeleteAllPhrase(lessonTitle: string): string {
  return `delete all extra practice for ${lessonTitle}`;
}

/** @deprecated Extra practice is derived from the chapter bank. */
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
    questionBank: stripLessonKey(store.questionBank, key),
    videos: stripLessonKey(store.videos, key),
  };
}

export function removeCourseFromStore(
  store: AdminContentStore,
  courseId: string,
): AdminContentStore {
  const textbooks = { ...(store.textbooks ?? {}) };
  delete textbooks[courseId];

  return {
    ...store,
    courses: store.courses.filter((course) => course.id !== courseId),
    questionBank: stripKeysForCourse(store.questionBank, courseId),
    videos: stripKeysForCourse(store.videos, courseId),
    textbooks,
  };
}
