import type { AdminFlashcard } from "@/lib/lesson/admin-flashcard-types";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import { mergeLegacyQuestionBank } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { normalizeLessonAccessTier } from "@/lib/student/lesson-access";
import { SEED_COURSES } from "@/lib/student/curriculum-seed";
import { SEED_TEXTBOOKS, type Textbook } from "@/lib/student/textbook";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import { normalizeGradingRubric } from "@/lib/lesson/lesson-grade-config";
import {
  parseChapterFromId,
  sortLessons,
  sortOrderForLesson,
} from "@/lib/student/lesson-sort";

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
  /** Flashcard terms keyed by courseId/lessonId. Students write definitions. */
  flashcardsByLesson?: Record<string, AdminFlashcard[]>;
  /** Warm-up review questions shown before lesson content. */
  reviewQuestionsByLesson?: Record<string, LessonQuestion[]>;
  /** Per-course grading rubric and defaults. */
  gradingConfigByCourse?: Record<string, GradingRubricConfig>;
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
    accessTier: normalizeLessonAccessTier(lesson.accessTier, lesson.id),
  };
}

function normalizeCourseLessons(lessons: CurriculumLesson[]): CurriculumLesson[] {
  const migrated = lessons.map(migrateLessonFields);
  const byChapterId = new Map<string, CurriculumLesson[]>();

  for (const lesson of migrated) {
    const list = byChapterId.get(lesson.chapterId) ?? [];
    list.push(lesson);
    byChapterId.set(lesson.chapterId, list);
  }

  const normalized: CurriculumLesson[] = [];
  for (const group of byChapterId.values()) {
    const sorted = [...group].sort((a, b) => a.order - b.order);
    sorted.forEach((lesson, index) => {
      const chapter =
        lesson.chapter ?? parseChapterFromId(lesson.chapterId) ?? 1;
      const section = lesson.section ?? index + 1;
      const next = {
        ...lesson,
        chapter,
        section,
        chapterId: lesson.chapterId || `chapter-${chapter}`,
      };
      normalized.push({
        ...next,
        order: sortOrderForLesson(next),
      });
    });
  }

  return sortLessons(normalized);
}

function migrateCourses(courses: Course[]): Course[] {
  return courses.map((course) => ({
    ...course,
    lessons: normalizeCourseLessons(course.lessons),
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
    courses: migrateCourses(cloneCourses()),
    questionBank: {},
    videos: {},
    textbooks: { ...SEED_TEXTBOOKS },
    flashcardsByLesson: {},
    reviewQuestionsByLesson: {},
    gradingConfigByCourse: {},
  };
}

function ensureFlashcards(store: AdminContentStore): AdminContentStore {
  if (store.flashcardsByLesson !== undefined) {
    return store;
  }
  return { ...store, flashcardsByLesson: {} };
}

function ensureReviewQuestions(store: AdminContentStore): AdminContentStore {
  if (store.reviewQuestionsByLesson !== undefined) {
    return store;
  }
  return { ...store, reviewQuestionsByLesson: {} };
}

function ensureGradingConfig(store: AdminContentStore): AdminContentStore {
  if (store.gradingConfigByCourse !== undefined) {
    return store;
  }
  return { ...store, gradingConfigByCourse: {} };
}

export function sanitizeContentStore(store: AdminContentStore): AdminContentStore {
  const questionBank = normalizeQuestionBank(store);
  const withGrading = ensureGradingConfig(store);
  const gradingConfigByCourse: Record<string, GradingRubricConfig> = {};
  for (const course of withGrading.courses) {
    gradingConfigByCourse[course.id] = normalizeGradingRubric(
      withGrading.gradingConfigByCourse?.[course.id],
    );
  }
  return ensureReviewQuestions(
    ensureFlashcards(
      ensureTextbooks(
        stripLegacyVideoBlobs({
          ...withGrading,
          version: CURRENT_STORE_VERSION,
          courses: migrateCourses(withGrading.courses),
          questionBank,
          gradingConfigByCourse,
          lessonQuestions: undefined,
          alcumusByLesson: undefined,
        }),
      ),
    ),
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

export function getFlashcardsFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): AdminFlashcard[] {
  const key = lessonKey(courseId, lessonId);
  return store.flashcardsByLesson?.[key] ?? [];
}

export function setFlashcardsInStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  flashcards: AdminFlashcard[],
): AdminContentStore {
  const key = lessonKey(courseId, lessonId);
  return {
    ...store,
    flashcardsByLesson: {
      ...(store.flashcardsByLesson ?? {}),
      [key]: flashcards,
    },
  };
}

export function getReviewQuestionsFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): LessonQuestion[] {
  const key = lessonKey(courseId, lessonId);
  return store.reviewQuestionsByLesson?.[key] ?? [];
}

export function setReviewQuestionsInStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  questions: LessonQuestion[],
): AdminContentStore {
  const key = lessonKey(courseId, lessonId);
  return {
    ...store,
    reviewQuestionsByLesson: {
      ...(store.reviewQuestionsByLesson ?? {}),
      [key]: questions,
    },
  };
}

export function getGradingConfigFromStore(
  store: AdminContentStore,
  courseId: string,
): GradingRubricConfig {
  return normalizeGradingRubric(store.gradingConfigByCourse?.[courseId]);
}

export function setGradingConfigInStore(
  store: AdminContentStore,
  courseId: string,
  config: GradingRubricConfig,
): AdminContentStore {
  return {
    ...store,
    gradingConfigByCourse: {
      ...(store.gradingConfigByCourse ?? {}),
      [courseId]: normalizeGradingRubric(config),
    },
  };
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

/** Exact phrase admins must type to confirm deleting all review questions for a lesson. */
export function reviewQuestionsDeleteAllPhrase(lessonTitle: string): string {
  return `delete all review questions for ${lessonTitle}`;
}

/** Exact phrase admins must type to confirm deleting one review question. */
export function reviewQuestionDeletePhrase(questionNumber: number): string {
  return `delete review question ${questionNumber}`;
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
    flashcardsByLesson: stripLessonKey(store.flashcardsByLesson ?? {}, key),
    reviewQuestionsByLesson: stripLessonKey(store.reviewQuestionsByLesson ?? {}, key),
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
    flashcardsByLesson: stripKeysForCourse(store.flashcardsByLesson ?? {}, courseId),
    reviewQuestionsByLesson: stripKeysForCourse(
      store.reviewQuestionsByLesson ?? {},
      courseId,
    ),
    gradingConfigByCourse: stripKeysForCourse(
      store.gradingConfigByCourse ?? {},
      courseId,
    ),
    textbooks,
  };
}
