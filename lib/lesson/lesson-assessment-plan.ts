import type { AdminContentStore } from "@/lib/admin/content-store";
import {
  getQuestionBankFromStore,
  getReviewQuestionsFromStore,
} from "@/lib/admin/content-store";
import type { AssignmentAlgorithmConfig } from "@/lib/lesson/assignment-algorithm-config";
import {
  lessonIsReviewOnly,
  lessonUsesPriorReviewForMcFib,
  normalizeAssignmentAlgorithm,
  resolveRubricForLesson,
} from "@/lib/lesson/assignment-algorithm-config";
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

export type TaggedLessonQuestion = LessonQuestion & {
  fromLessonId: string;
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

/** Review questions from lessons that appear before the current one. */
export function collectPriorReviewQuestions(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
): TaggedLessonQuestion[] {
  const sorted = sortLessons(course.lessons);
  const currentIndex = sorted.findIndex((entry) => entry.id === lesson.id);
  if (currentIndex <= 0) return [];

  const tagged: TaggedLessonQuestion[] = [];
  for (let i = 0; i < currentIndex; i += 1) {
    const entry = sorted[i];
    for (const question of getReviewQuestionsFromStore(
      store,
      course.id,
      entry.id,
    )) {
      tagged.push({ ...question, fromLessonId: entry.id });
    }
  }
  return tagged;
}

/**
 * Draw MC or FIB items from prior lessons’ review banks.
 * Prefers matching question type, then fills from other prior review types
 * so philosophy-style chapters need not invent local MC/FIB banks.
 */
export function selectFromPriorReviews(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
  type: LessonQuestion["type"],
  count: number,
  seed: string,
  excludeIds: Set<string> = new Set(),
): TaggedLessonQuestion[] {
  if (count <= 0) return [];

  const prior = collectPriorReviewQuestions(store, course, lesson).filter(
    (question) => !excludeIds.has(question.id),
  );
  if (prior.length === 0) return [];

  const preferred = prior.filter((question) => question.type === type);
  const others = prior.filter((question) => question.type !== type);
  const ordered = [
    ...seededShuffle(preferred, `${seed}-${type}`),
    ...seededShuffle(others, `${seed}-${type}-fill`),
  ];

  const picked: TaggedLessonQuestion[] = [];
  const used = new Set<string>();
  for (const question of ordered) {
    if (used.has(question.id)) continue;
    used.add(question.id);
    picked.push(question);
    if (picked.length >= count) break;
  }
  return picked;
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

function untag(questions: TaggedLessonQuestion[]): LessonQuestion[] {
  return questions.map(({ fromLessonId: _from, ...question }) => question);
}

export function buildLessonAssessmentPlan(
  store: AdminContentStore,
  course: Course,
  lesson: CurriculumLesson,
  rubric: GradingRubricConfig = normalizeGradingRubric(),
  algorithmInput?: Partial<AssignmentAlgorithmConfig> | null,
): LessonAssessmentPlan {
  const algorithm = normalizeAssignmentAlgorithm(algorithmInput);
  const config = resolveRubricForLesson(rubric, algorithm, lesson);
  const bank = collectBankQuestions(store, course.id, lesson.id);
  const reviewAll = getReviewQuestionsFromStore(store, course.id, lesson.id);
  const seed = `${course.id}/${lesson.id}/extra`;
  const reviewOnly = lessonIsReviewOnly(algorithm, lesson);
  const usePriorReviews =
    !reviewOnly && lessonUsesPriorReviewForMcFib(algorithm, lesson);

  const review = reviewAll.slice(0, config.reviewCount);
  const excludeIds = new Set(review.map((question) => question.id));

  let multipleChoice: LessonQuestion[] = [];
  let fillInBlank: LessonQuestion[] = [];
  let freeResponse: LessonQuestion | null = null;
  let extraPractice: LessonQuestion[] = [];

  if (!reviewOnly) {
    if (usePriorReviews) {
      const mcTagged = selectFromPriorReviews(
        store,
        course,
        lesson,
        "multiple-choice",
        config.mcBankSize,
        `${seed}-mc-prior`,
        excludeIds,
      );
      for (const question of mcTagged) excludeIds.add(question.id);

      const fibTagged = selectFromPriorReviews(
        store,
        course,
        lesson,
        "fill-in-the-blank",
        config.fibCount,
        `${seed}-fib-prior`,
        excludeIds,
      );

      multipleChoice =
        mcTagged.length > 0
          ? untag(mcTagged)
          : takeByType(bank, "multiple-choice", config.mcBankSize);
      fillInBlank =
        fibTagged.length > 0
          ? untag(fibTagged)
          : takeByType(bank, "fill-in-the-blank", config.fibCount);
    } else {
      multipleChoice = takeByType(bank, "multiple-choice", config.mcBankSize);
      fillInBlank = takeByType(bank, "fill-in-the-blank", config.fibCount);
    }

    extraPractice = selectExtraPracticeQuestions(
      store,
      course,
      lesson,
      config.extraCount,
      seed,
      algorithm,
    );
    freeResponse =
      takeByType(bank, "long-answer", config.freeResponseCount)[0] ?? null;
  }

  return {
    review,
    multipleChoice,
    fillInBlank,
    extraPractice,
    freeResponse,
  };
}
