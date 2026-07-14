import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import { normalizeGradingRubric } from "@/lib/lesson/lesson-grade-config";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import { lessonChapterNumber } from "@/lib/student/lesson-sort";

/**
 * Per-chapter overrides for question counts and sourcing.
 * Omitted fields inherit the course grading defaults / algorithm defaults.
 */
export type ChapterAlgorithmOverride = {
  /** Warm-up review count for lessons in this chapter. */
  reviewCount?: number;
  mcBankSize?: number;
  mcTargetCorrect?: number;
  fibCount?: number;
  extraCount?: number;
  freeResponseCount?: number;
  /**
   * Draw MC / fill-in-blank from prior lessons’ review banks instead of
   * this chapter’s question bank.
   */
  usePriorReviewsForMcFib?: boolean;
  /**
   * Skip new chapter-bank work: force MC, FIB, graded extra, and free response
   * counts to 0 so students only do this lesson’s warm-up review questions.
   */
  reviewOnly?: boolean;
};

/**
 * Tunables for how questions are drawn from chapter banks and review pools.
 * Counts that also affect scoring live on the grading rubric; these knobs
 * control *how* pools are preferred and split.
 */
export type AssignmentAlgorithmConfig = {
  /**
   * Graded "extra practice": how many questions to take first from the
   * preferred pool (prior sections in this chapter, or prior chapter when
   * starting a new chapter). Remaining slots fill from the rest of the course.
   */
  extraPrimaryPoolTake: number;
  /** Bonus practice path: max required questions drawn from easy difficulty. */
  maxEndOfChapterQuestions: number;
  /** Bonus practice path: difficulty 1..N counts as "easy" / assignment-eligible. */
  easyDifficultyMax: AlcumusLevel;
  /** Bonus Alcumus session length drawn from leftover practice pool. */
  extraPracticeSessionSize: number;
  /**
   * @deprecated Prefer chapterOverrides[n].usePriorReviewsForMcFib.
   * Kept for backward compatibility with previously saved configs.
   */
  priorReviewChapterNumbers: number[];
  /** Per-chapter count and sourcing overrides, keyed by chapter number string. */
  chapterOverrides: Record<string, ChapterAlgorithmOverride>;
};

export const DEFAULT_ASSIGNMENT_ALGORITHM: AssignmentAlgorithmConfig = {
  extraPrimaryPoolTake: 2,
  maxEndOfChapterQuestions: 4,
  easyDifficultyMax: 2,
  extraPracticeSessionSize: 5,
  priorReviewChapterNumbers: [],
  chapterOverrides: {},
};

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function optionalNonNegativeInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

function clampLevel(value: unknown, fallback: AlcumusLevel): AlcumusLevel {
  const n = positiveInt(value, fallback);
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n as AlcumusLevel;
}

function normalizeChapterNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const numbers = value
    .map((entry) =>
      typeof entry === "number" ? entry : Number.parseInt(String(entry), 10),
    )
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => Math.floor(n));
  return [...new Set(numbers)].sort((a, b) => a - b);
}

function normalizeChapterOverride(
  value: unknown,
): ChapterAlgorithmOverride | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const next: ChapterAlgorithmOverride = {};

  const reviewCount = optionalNonNegativeInt(raw.reviewCount);
  const mcBankSize = optionalNonNegativeInt(raw.mcBankSize);
  const mcTargetCorrect = optionalNonNegativeInt(raw.mcTargetCorrect);
  const fibCount = optionalNonNegativeInt(raw.fibCount);
  const extraCount = optionalNonNegativeInt(raw.extraCount);
  const freeResponseCount = optionalNonNegativeInt(raw.freeResponseCount);

  if (reviewCount !== undefined) next.reviewCount = reviewCount;
  if (mcBankSize !== undefined) next.mcBankSize = mcBankSize;
  if (mcTargetCorrect !== undefined) next.mcTargetCorrect = mcTargetCorrect;
  if (fibCount !== undefined) next.fibCount = fibCount;
  if (extraCount !== undefined) next.extraCount = extraCount;
  if (freeResponseCount !== undefined) next.freeResponseCount = freeResponseCount;
  if (typeof raw.usePriorReviewsForMcFib === "boolean") {
    next.usePriorReviewsForMcFib = raw.usePriorReviewsForMcFib;
  }
  if (typeof raw.reviewOnly === "boolean") {
    next.reviewOnly = raw.reviewOnly;
  }

  return Object.keys(next).length > 0 ? next : null;
}

function normalizeChapterOverrides(
  value: unknown,
  legacyPriorChapters: number[],
): Record<string, ChapterAlgorithmOverride> {
  const overrides: Record<string, ChapterAlgorithmOverride> = {};

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const chapter = Number.parseInt(key, 10);
      if (!Number.isFinite(chapter) || chapter <= 0) continue;
      const normalized = normalizeChapterOverride(entry);
      if (normalized) overrides[String(chapter)] = normalized;
    }
  }

  for (const chapter of legacyPriorChapters) {
    const key = String(chapter);
    const existing = overrides[key] ?? {};
    if (existing.usePriorReviewsForMcFib === undefined) {
      overrides[key] = { ...existing, usePriorReviewsForMcFib: true };
    }
  }

  return overrides;
}

export function normalizeAssignmentAlgorithm(
  partial?: Partial<AssignmentAlgorithmConfig> | null,
): AssignmentAlgorithmConfig {
  if (!partial) {
    return {
      ...DEFAULT_ASSIGNMENT_ALGORITHM,
      priorReviewChapterNumbers: [],
      chapterOverrides: {},
    };
  }

  const priorReviewChapterNumbers = normalizeChapterNumbers(
    partial.priorReviewChapterNumbers,
  );
  const chapterOverrides = normalizeChapterOverrides(
    partial.chapterOverrides,
    priorReviewChapterNumbers,
  );

  // Keep legacy list in sync with override flags for older readers.
  const syncedPrior = Object.entries(chapterOverrides)
    .filter(([, override]) => override.usePriorReviewsForMcFib)
    .map(([chapter]) => Number.parseInt(chapter, 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  return {
    extraPrimaryPoolTake: nonNegativeInt(
      partial.extraPrimaryPoolTake,
      DEFAULT_ASSIGNMENT_ALGORITHM.extraPrimaryPoolTake,
    ),
    maxEndOfChapterQuestions: positiveInt(
      partial.maxEndOfChapterQuestions,
      DEFAULT_ASSIGNMENT_ALGORITHM.maxEndOfChapterQuestions,
    ),
    easyDifficultyMax: clampLevel(
      partial.easyDifficultyMax,
      DEFAULT_ASSIGNMENT_ALGORITHM.easyDifficultyMax,
    ),
    extraPracticeSessionSize: positiveInt(
      partial.extraPracticeSessionSize,
      DEFAULT_ASSIGNMENT_ALGORITHM.extraPracticeSessionSize,
    ),
    priorReviewChapterNumbers: syncedPrior,
    chapterOverrides,
  };
}

export function getChapterOverride(
  algorithm: AssignmentAlgorithmConfig,
  chapter: number,
): ChapterAlgorithmOverride {
  return algorithm.chapterOverrides[String(chapter)] ?? {};
}

export function setChapterOverride(
  algorithm: AssignmentAlgorithmConfig,
  chapter: number,
  patch: ChapterAlgorithmOverride | null,
): AssignmentAlgorithmConfig {
  const nextOverrides = { ...algorithm.chapterOverrides };
  if (!patch || Object.keys(patch).length === 0) {
    delete nextOverrides[String(chapter)];
  } else {
    const cleaned = normalizeChapterOverride(patch);
    if (cleaned) nextOverrides[String(chapter)] = cleaned;
    else delete nextOverrides[String(chapter)];
  }
  return normalizeAssignmentAlgorithm({
    ...algorithm,
    chapterOverrides: nextOverrides,
  });
}

export function lessonUsesPriorReviewForMcFib(
  algorithm: AssignmentAlgorithmConfig,
  lesson: CurriculumLesson,
): boolean {
  const chapter = lessonChapterNumber(lesson);
  const override = getChapterOverride(algorithm, chapter);
  if (override.reviewOnly) return false;
  if (typeof override.usePriorReviewsForMcFib === "boolean") {
    return override.usePriorReviewsForMcFib;
  }
  return algorithm.priorReviewChapterNumbers.includes(chapter);
}

export function lessonIsReviewOnly(
  algorithm: AssignmentAlgorithmConfig,
  lesson: CurriculumLesson,
): boolean {
  return Boolean(getChapterOverride(algorithm, lessonChapterNumber(lesson)).reviewOnly);
}

/**
 * Merge course rubric with chapter overrides for plan building.
 * reviewOnly zeroes new-question phases.
 */
export function resolveRubricForChapter(
  rubricInput: Partial<GradingRubricConfig> | null | undefined,
  algorithm: AssignmentAlgorithmConfig,
  chapter: number,
): GradingRubricConfig {
  const base = normalizeGradingRubric(rubricInput);
  const override = getChapterOverride(algorithm, chapter);

  const merged: GradingRubricConfig = {
    ...base,
    reviewCount: override.reviewCount ?? base.reviewCount,
    mcBankSize: override.mcBankSize ?? base.mcBankSize,
    mcTargetCorrect: override.mcTargetCorrect ?? base.mcTargetCorrect,
    fibCount: override.fibCount ?? base.fibCount,
    extraCount: override.extraCount ?? base.extraCount,
    freeResponseCount: override.freeResponseCount ?? base.freeResponseCount,
  };

  if (override.reviewOnly) {
    return {
      ...merged,
      mcBankSize: 0,
      mcTargetCorrect: 0,
      fibCount: 0,
      extraCount: 0,
      freeResponseCount: 0,
    };
  }

  return merged;
}

export function resolveRubricForLesson(
  rubricInput: Partial<GradingRubricConfig> | null | undefined,
  algorithm: AssignmentAlgorithmConfig,
  lesson: CurriculumLesson,
): GradingRubricConfig {
  return resolveRubricForChapter(
    rubricInput,
    algorithm,
    lessonChapterNumber(lesson),
  );
}

export const ALGORITHM_FIELD_META: Array<{
  key: Exclude<
    keyof AssignmentAlgorithmConfig,
    "priorReviewChapterNumbers" | "chapterOverrides"
  >;
  label: string;
  description: string;
  min: number;
  max: number;
}> = [
  {
    key: "extraPrimaryPoolTake",
    label: "Preferred-pool take (graded extra)",
    description:
      "How many graded review/extra questions come from prior sections in this chapter (or the previous chapter when starting a new chapter), before filling from the rest of the course.",
    min: 0,
    max: 20,
  },
  {
    key: "maxEndOfChapterQuestions",
    label: "Bonus assignment slots",
    description:
      "On the optional bonus practice path, max questions drawn from easy difficulty for a sticky per-student set.",
    min: 1,
    max: 20,
  },
  {
    key: "easyDifficultyMax",
    label: "Easy difficulty max (1–5)",
    description:
      "Difficulties at or below this level are eligible for the bonus assignment slots; higher levels go only to leftover practice.",
    min: 1,
    max: 5,
  },
  {
    key: "extraPracticeSessionSize",
    label: "Bonus Alcumus session size",
    description:
      "How many leftover-bank questions appear in one optional /practice Alcumus session.",
    min: 1,
    max: 30,
  },
];
