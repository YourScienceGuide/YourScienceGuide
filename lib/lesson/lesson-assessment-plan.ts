import type { AdminContentStore } from "@/lib/admin/content-store";
import {
  getQuestionBankFromStore,
  getReviewQuestionsFromStore,
} from "@/lib/admin/content-store";
import type { AssignmentAlgorithmConfig } from "@/lib/lesson/assignment-algorithm-config";
import { normalizeAssignmentAlgorithm } from "@/lib/lesson/assignment-algorithm-config";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import { normalizeGradingRubric } from "@/lib/lesson/lesson-grade-config";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import { stripChapterDifficulty } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { sortLessons } from "@/lib/student/lesson-sort";
import {
  lessonChapterNumber,
  lessonSectionNumber,
} from "@/lib/student/lesson-sort";

export type LessonAssessmentPlan = {
  review: LessonQuestion[];
  multipleChoice: LessonQuestion[];
  fillInBlank: LessonQuestion[];
  extraPractice: LessonQuestion[];
  freeResponse: LessonQuestion | null;
};

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let state = hashSeed(seed) || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function takeByType(
  bank: ChapterQuestion[],
  type: LessonQuestion["type"],
  count: number,
): LessonQuestion[] {
  return bank
    .filter((q) => q.type === type)
    .slice(0, count)
    .map(stripChapterDifficulty);
}

function collectBankQuestions(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): ChapterQuestion[] {
  return getQuestionBankFromStore(store, courseId, lessonId);
}

function isFirstSectionOfCourse(lesson: CurriculumLesson): boolean {
  return lessonChapterNumber(lesson) === 1 && lessonSectionNumber(lesson) === 1;
}

function isFirstSectionInChapter(lesson: CurriculumLesson): boolean {
  return lessonSectionNumber(lesson) === 1;
}

export function selectExtraPracticeQuestions(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
  count: number,
  seed: string,
  algorithmInput?: Partial<AssignmentAlgorithmConfig> | null,
): LessonQuestion[] {
  const algorithm = normalizeAssignmentAlgorithm(algorithmInput);
  const sorted = sortLessons(course.lessons);
  const currentIndex = sorted.findIndex((entry) => entry.id === lesson.id);
  if (currentIndex < 0 || count <= 0) return [];

  const chapter = lessonChapterNumber(lesson);
  const allOther: ChapterQuestion[] = [];

  for (const entry of sorted) {
    if (entry.id === lesson.id) continue;
    allOther.push(...collectBankQuestions(store, course.id, entry.id));
  }

  if (isFirstSectionOfCourse(lesson)) {
    return seededShuffle(allOther, seed).slice(0, count).map(stripChapterDifficulty);
  }

  const previousInChapter: ChapterQuestion[] = [];
  const previousChapter: ChapterQuestion[] = [];

  for (let i = 0; i < currentIndex; i += 1) {
    const entry = sorted[i];
    const entryChapter = lessonChapterNumber(entry);
    const bank = collectBankQuestions(store, course.id, entry.id);
    if (entryChapter === chapter) {
      previousInChapter.push(...bank);
    } else if (entryChapter === chapter - 1) {
      previousChapter.push(...bank);
    }
  }

  const primaryPool = isFirstSectionInChapter(lesson)
    ? previousChapter
    : previousInChapter;
  const primaryTake = Math.min(
    Math.max(0, algorithm.extraPrimaryPoolTake),
    count,
  );
  const fromPrimary = seededShuffle(primaryPool, `${seed}-primary`).slice(
    0,
    primaryTake,
  );
  const usedIds = new Set(fromPrimary.map((q) => q.id));
  const restPool = allOther.filter((q) => !usedIds.has(q.id));
  const fromRest = seededShuffle(restPool, `${seed}-rest`).slice(
    0,
    count - fromPrimary.length,
  );

  return [...fromPrimary, ...fromRest]
    .slice(0, count)
    .map(stripChapterDifficulty);
}

export function buildLessonAssessmentPlan(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
  rubric: GradingRubricConfig = normalizeGradingRubric(),
  algorithm?: Partial<AssignmentAlgorithmConfig> | null,
): LessonAssessmentPlan {
  const config = normalizeGradingRubric(rubric);
  const bank = collectBankQuestions(store, course.id, lesson.id);
  const reviewAll = getReviewQuestionsFromStore(store, course.id, lesson.id);
  const seed = `${course.id}/${lesson.id}/extra`;

  return {
    review: reviewAll.slice(0, config.reviewCount),
    multipleChoice: takeByType(bank, "multiple-choice", config.mcBankSize),
    fillInBlank: takeByType(bank, "fill-in-the-blank", config.fibCount),
    extraPractice: selectExtraPracticeQuestions(
      store,
      course,
      lesson,
      config.extraCount,
      seed,
      algorithm,
    ),
    freeResponse:
      takeByType(bank, "long-answer", config.freeResponseCount)[0] ?? null,
  };
}
