import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import { lessonChapterNumber } from "@/lib/student/lesson-sort";

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
   * Course chapter numbers whose lessons skip local MC / fill-in-blank banks
   * and instead draw those phases from prior lessons’ review question banks.
   * Useful for chapters that don’t lend themselves to new MCQ/FITB content
   * (e.g. philosophy of science). Configured per course by admins.
   */
  priorReviewChapterNumbers: number[];
};

export const DEFAULT_ASSIGNMENT_ALGORITHM: AssignmentAlgorithmConfig = {
  extraPrimaryPoolTake: 2,
  maxEndOfChapterQuestions: 4,
  easyDifficultyMax: 2,
  extraPracticeSessionSize: 5,
  priorReviewChapterNumbers: [],
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

export function normalizeAssignmentAlgorithm(
  partial?: Partial<AssignmentAlgorithmConfig> | null,
): AssignmentAlgorithmConfig {
  if (!partial) return { ...DEFAULT_ASSIGNMENT_ALGORITHM, priorReviewChapterNumbers: [] };
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
    priorReviewChapterNumbers: normalizeChapterNumbers(
      partial.priorReviewChapterNumbers,
    ),
  };
}

export function lessonUsesPriorReviewForMcFib(
  algorithm: AssignmentAlgorithmConfig,
  lesson: CurriculumLesson,
): boolean {
  return algorithm.priorReviewChapterNumbers.includes(
    lessonChapterNumber(lesson),
  );
}

export const ALGORITHM_FIELD_META: Array<{
  key: Exclude<keyof AssignmentAlgorithmConfig, "priorReviewChapterNumbers">;
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
