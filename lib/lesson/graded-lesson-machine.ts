import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import {
  graduationThresholdForLesson,
  maxLessonScore,
  normalizeGradingRubric,
} from "@/lib/lesson/lesson-grade-config";

export type GradedLessonPhase =
  | "review"
  | "multiple-choice"
  | "fill-in-blank"
  | "extra-practice"
  | "free-response"
  | "complete";

const GRADED_LESSON_PHASE_ORDER: GradedLessonPhase[] = [
  "review",
  "multiple-choice",
  "fill-in-blank",
  "extra-practice",
  "free-response",
  "complete",
];

export function isGradedLessonPhasePast(
  currentPhase: GradedLessonPhase,
  sectionPhase: GradedLessonPhase,
): boolean {
  const currentIndex = GRADED_LESSON_PHASE_ORDER.indexOf(currentPhase);
  const sectionIndex = GRADED_LESSON_PHASE_ORDER.indexOf(sectionPhase);
  if (currentIndex < 0 || sectionIndex < 0) return false;
  return currentIndex > sectionIndex;
}

export type GradedLessonProgress = {
  phase: GradedLessonPhase;
  reviewCorrectIds: string[];
  reviewHeldIds: string[];
  mcQuestionIds: string[];
  mcIndex: number;
  mcCorrectCount: number;
  mcCorrectIds: string[];
  fibQuestionIds: string[];
  fibCorrectIds: string[];
  fibHeldIds: string[];
  fibIndex: number;
  extraQuestionIds: string[];
  extraCorrectIds: string[];
  extraIndex: number;
  freeResponseQuestionId: string | null;
  freeResponseSubmitted: boolean;
  freeResponseSubmissionId: string | null;
  freeResponseParentScore: number | null;
  graduated: boolean;
  problemsSolved: number;
};

export type LessonScoreBreakdown = {
  review: number;
  multipleChoice: number;
  fillInBlank: number;
  extraPractice: number;
  freeResponse: number;
  earned: number;
  possible: number;
  percent: number;
};

export const INITIAL_GRADED_LESSON_PROGRESS: GradedLessonProgress = {
  phase: "review",
  reviewCorrectIds: [],
  reviewHeldIds: [],
  mcQuestionIds: [],
  mcIndex: 0,
  mcCorrectCount: 0,
  mcCorrectIds: [],
  fibQuestionIds: [],
  fibCorrectIds: [],
  fibHeldIds: [],
  fibIndex: 0,
  extraQuestionIds: [],
  extraCorrectIds: [],
  extraIndex: 0,
  freeResponseQuestionId: null,
  freeResponseSubmitted: false,
  freeResponseSubmissionId: null,
  freeResponseParentScore: null,
  graduated: false,
  problemsSolved: 0,
};

export function hydrateGradedProgress(
  stored: Partial<GradedLessonProgress> | null,
  plan: {
    review: { id: string }[];
    multipleChoice: { id: string }[];
    fillInBlank: { id: string }[];
    extraPractice: { id: string }[];
    freeResponse: { id: string } | null;
  },
  isLockedToday: (questionId: string) => boolean = () => false,
): GradedLessonProgress {
  const base = { ...INITIAL_GRADED_LESSON_PROGRESS, ...stored };
  const reviewHeldIds = base.reviewHeldIds.filter(isLockedToday);
  const fibHeldIds = base.fibHeldIds.filter(isLockedToday);
  const normalized = { ...base, reviewHeldIds, fibHeldIds };
  const mcQuestionIds =
    normalized.mcQuestionIds.length > 0
      ? normalized.mcQuestionIds
      : plan.multipleChoice.map((q) => q.id);
  const fibQuestionIds =
    normalized.fibQuestionIds.length > 0
      ? normalized.fibQuestionIds
      : plan.fillInBlank.map((q) => q.id);
  const extraQuestionIds =
    normalized.extraQuestionIds.length > 0
      ? normalized.extraQuestionIds
      : plan.extraPractice.map((q) => q.id);

  let phase = normalized.phase;
  if (
    phase === "review" &&
    reviewPhaseComplete(normalized, plan.review, isLockedToday) &&
    plan.review.length > 0
  ) {
    phase = "multiple-choice";
  }
  if (phase === "multiple-choice" && isMcPhaseComplete(normalized, plan.multipleChoice.length)) {
    phase = plan.fillInBlank.length > 0 ? "fill-in-blank" : nextAfterFib(plan);
  }
  if (phase === "fill-in-blank" && normalized.fibCorrectIds.length >= plan.fillInBlank.length && plan.fillInBlank.length > 0) {
    phase = nextAfterFib(plan);
  }
  if (phase === "extra-practice" && normalized.extraCorrectIds.length >= plan.extraPractice.length && plan.extraPractice.length > 0) {
    phase = plan.freeResponse ? "free-response" : "complete";
  }
  if (phase === "free-response" && normalized.freeResponseSubmitted) {
    phase = "complete";
  }
  if (plan.review.length === 0 && phase === "review") {
    phase = plan.multipleChoice.length > 0 ? "multiple-choice" : nextAfterFib(plan);
  }

  const problemsSolved = countProblemsSolved({
    ...normalized,
    mcQuestionIds,
    fibQuestionIds,
    extraQuestionIds,
  });

  let hydratedProgress: GradedLessonProgress = {
    ...normalized,
    phase,
    mcQuestionIds,
    fibQuestionIds,
    extraQuestionIds,
    freeResponseQuestionId:
      normalized.freeResponseQuestionId ?? plan.freeResponse?.id ?? null,
    problemsSolved,
    graduated: normalized.graduated,
  };

  hydratedProgress = skipEmptyPhases(hydratedProgress, plan);

  return hydratedProgress;
}

function skipEmptyPhases(
  progress: GradedLessonProgress,
  plan: {
    review: unknown[];
    multipleChoice: unknown[];
    fillInBlank: unknown[];
    extraPractice: unknown[];
    freeResponse: unknown | null;
  },
): GradedLessonProgress {
  let next = progress;
  if (next.phase === "review" && plan.review.length === 0) {
    next = { ...next, phase: "multiple-choice" };
  }
  if (next.phase === "multiple-choice" && plan.multipleChoice.length === 0) {
    next = {
      ...next,
      phase: plan.fillInBlank.length > 0 ? "fill-in-blank" : "extra-practice",
    };
  }
  if (next.phase === "fill-in-blank" && plan.fillInBlank.length === 0) {
    next = {
      ...next,
      phase: plan.extraPractice.length > 0
        ? "extra-practice"
        : plan.freeResponse
          ? "free-response"
          : "complete",
    };
  }
  if (next.phase === "extra-practice" && plan.extraPractice.length === 0) {
    next = { ...next, phase: plan.freeResponse ? "free-response" : "complete" };
  }
  if (next.phase === "free-response" && !plan.freeResponse) {
    next = { ...next, phase: "complete" };
  }
  if (next.phase === "free-response" && next.freeResponseSubmitted) {
    next = { ...next, phase: "complete" };
  }
  return next;
}

function nextAfterFib(plan: {
  fillInBlank: unknown[];
  extraPractice: unknown[];
  freeResponse: unknown | null;
}): GradedLessonPhase {
  if (plan.extraPractice.length > 0) return "extra-practice";
  if (plan.freeResponse) return "free-response";
  return "complete";
}

function isMcPhaseComplete(
  progress: GradedLessonProgress,
  bankSize: number,
  config?: GradingRubricConfig,
): boolean {
  const rubric = normalizeGradingRubric(config);
  return (
    progress.mcCorrectCount >= rubric.mcTargetCorrect ||
    progress.mcIndex >= bankSize ||
    bankSize === 0
  );
}

export function countProblemsSolved(progress: GradedLessonProgress): number {
  return (
    progress.mcCorrectIds.length +
    progress.fibCorrectIds.length +
    progress.extraCorrectIds.length
  );
}

export function applyReviewCorrect(
  progress: GradedLessonProgress,
  questionId: string,
  reviewTotal: number,
): GradedLessonProgress {
  if (progress.reviewCorrectIds.includes(questionId)) return progress;
  const reviewCorrectIds = [...progress.reviewCorrectIds, questionId];
  const reviewHeldIds = progress.reviewHeldIds.filter((id) => id !== questionId);
  const phase =
    reviewCorrectIds.length >= reviewTotal && reviewTotal > 0
      ? "multiple-choice"
      : progress.phase;
  return { ...progress, reviewCorrectIds, reviewHeldIds, phase };
}

export function applyReviewHeldForToday(
  progress: GradedLessonProgress,
  questionId: string,
): GradedLessonProgress {
  if (progress.reviewCorrectIds.includes(questionId)) return progress;
  const reviewHeldIds = progress.reviewHeldIds.includes(questionId)
    ? progress.reviewHeldIds
    : [...progress.reviewHeldIds, questionId];
  return { ...progress, reviewHeldIds };
}

export function applyMcResult(
  progress: GradedLessonProgress,
  questionId: string,
  correct: boolean,
  rubric: GradingRubricConfig,
  bankSize: number,
): GradedLessonProgress {
  const config = normalizeGradingRubric(rubric);
  let mcCorrectIds = progress.mcCorrectIds;
  let mcCorrectCount = progress.mcCorrectCount;
  if (correct && !mcCorrectIds.includes(questionId)) {
    mcCorrectIds = [...mcCorrectIds, questionId];
    mcCorrectCount += 1;
  }
  const mcIndex = progress.mcIndex + 1;
  const done =
    mcCorrectCount >= config.mcTargetCorrect || mcIndex >= bankSize || bankSize === 0;
  const next: GradedLessonProgress = {
    ...progress,
    mcCorrectIds,
    mcCorrectCount,
    mcIndex,
    problemsSolved: mcCorrectIds.length + progress.fibCorrectIds.length + progress.extraCorrectIds.length,
  };
  if (done) {
    const nextPhase =
      progress.fibQuestionIds.length > 0
        ? "fill-in-blank"
        : progress.extraQuestionIds.length > 0
          ? "extra-practice"
          : progress.freeResponseQuestionId
            ? "free-response"
            : "complete";
    return { ...next, phase: nextPhase };
  }
  return next;
}

export function applyFibCorrect(
  progress: GradedLessonProgress,
  questionId: string,
  fibTotal: number,
  hasExtra: boolean,
  hasFreeResponse: boolean,
): GradedLessonProgress {
  if (progress.fibCorrectIds.includes(questionId)) return progress;
  const fibCorrectIds = [...progress.fibCorrectIds, questionId];
  const problemsSolved =
    progress.mcCorrectIds.length + fibCorrectIds.length + progress.extraCorrectIds.length;
  let phase: GradedLessonPhase = progress.phase;
  if (fibCorrectIds.length >= fibTotal) {
    if (hasExtra) phase = "extra-practice";
    else if (hasFreeResponse) phase = "free-response";
    else phase = "complete";
  }
  return { ...progress, fibCorrectIds, fibIndex: progress.fibIndex + 1, problemsSolved, phase };
}

export function applyFibHeldForToday(
  progress: GradedLessonProgress,
  questionId: string,
  fibTotal: number,
  hasExtra: boolean,
  hasFreeResponse: boolean,
): GradedLessonProgress {
  if (progress.fibCorrectIds.includes(questionId)) return progress;
  const fibHeldIds = progress.fibHeldIds.includes(questionId)
    ? progress.fibHeldIds
    : [...progress.fibHeldIds, questionId];
  const fibIndex = progress.fibIndex + 1;
  let phase: GradedLessonPhase = progress.phase;
  if (fibIndex >= fibTotal) {
    if (hasExtra) phase = "extra-practice";
    else if (hasFreeResponse) phase = "free-response";
    else phase = "complete";
  }
  return { ...progress, fibHeldIds, fibIndex, phase };
}

export function applyExtraCorrect(
  progress: GradedLessonProgress,
  questionId: string,
  extraTotal: number,
  hasFreeResponse: boolean,
): GradedLessonProgress {
  if (progress.extraCorrectIds.includes(questionId)) return progress;
  const extraCorrectIds = [...progress.extraCorrectIds, questionId];
  const problemsSolved =
    progress.mcCorrectIds.length + progress.fibCorrectIds.length + extraCorrectIds.length;
  let phase: GradedLessonPhase = progress.phase;
  if (extraCorrectIds.length >= extraTotal) {
    phase = hasFreeResponse ? "free-response" : "complete";
  }
  return { ...progress, extraCorrectIds, extraIndex: progress.extraIndex + 1, problemsSolved, phase };
}

export function applyFreeResponseSubmitted(
  progress: GradedLessonProgress,
  submissionId: string,
): GradedLessonProgress {
  return {
    ...progress,
    freeResponseSubmitted: true,
    freeResponseSubmissionId: submissionId,
    phase: "complete",
  };
}

export function applyParentFreeResponseScore(
  progress: GradedLessonProgress,
  score: number,
): GradedLessonProgress {
  return { ...progress, freeResponseParentScore: score };
}

export function checkGraduation(
  progress: GradedLessonProgress,
  rubric: GradingRubricConfig,
  lessonGraduationProblemCount?: number,
): GradedLessonProgress {
  const threshold = graduationThresholdForLesson(rubric, lessonGraduationProblemCount);
  if (progress.problemsSolved >= threshold) {
    return { ...progress, graduated: true };
  }
  return progress;
}

export function calculateLessonScore(
  progress: GradedLessonProgress,
  rubric: GradingRubricConfig,
): LessonScoreBreakdown {
  const config = normalizeGradingRubric(rubric);
  const review = progress.reviewCorrectIds.length * config.reviewPointsEach;
  const multipleChoice = progress.mcCorrectIds.length * config.mcPointsEach;
  const fillInBlank = progress.fibCorrectIds.length * config.fibPointsEach;
  const extraPractice = progress.extraCorrectIds.length * config.extraPointsEach;
  const freeResponse =
    progress.freeResponseParentScore != null
      ? Math.min(config.freeResponsePoints, Math.max(0, progress.freeResponseParentScore))
      : 0;
  const earned = review + multipleChoice + fillInBlank + extraPractice + freeResponse;
  const possible = maxLessonScore(config);
  const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  return {
    review,
    multipleChoice,
    fillInBlank,
    extraPractice,
    freeResponse,
    earned,
    possible,
    percent,
  };
}

export function calculateLessonCompletionPercent(
  progress: GradedLessonProgress,
  plan: {
    review: { id: string }[];
    multipleChoice: { id: string }[];
    fillInBlank: { id: string }[];
    extraPractice: { id: string }[];
    freeResponse: { id: string } | null;
  },
  isLockedToday: (questionId: string) => boolean,
): number {
  if (progress.phase === "complete") return 100;

  const totalSteps =
    plan.review.length +
    plan.multipleChoice.length +
    plan.fillInBlank.length +
    plan.extraPractice.length +
    (plan.freeResponse ? 1 : 0);

  if (totalSteps === 0) return 0;

  const reviewDone = plan.review.filter(
    (question) =>
      progress.reviewCorrectIds.includes(question.id) ||
      (progress.reviewHeldIds.includes(question.id) &&
        isLockedToday(question.id)),
  ).length;

  let completedSteps =
    reviewDone + progress.mcIndex + progress.fibIndex + progress.extraIndex;
  if (progress.freeResponseSubmitted) completedSteps += 1;

  return Math.min(100, Math.round((completedSteps / totalSteps) * 100));
}

export function canAccessLessonDuringReview(
  progress: GradedLessonProgress,
  reviewQuestions: { id: string }[],
  isLockedToday: (questionId: string) => boolean,
): boolean {
  if (reviewQuestions.length === 0) return true;
  if (reviewPhaseComplete(progress, reviewQuestions, isLockedToday)) return true;
  const currentReviewId = currentReviewQuestionId(
    progress,
    reviewQuestions,
    isLockedToday,
  );
  return currentReviewId !== null && isLockedToday(currentReviewId);
}

export function reviewPhaseComplete(
  progress: GradedLessonProgress,
  reviewQuestions: { id: string }[],
  isLockedToday: (questionId: string) => boolean,
): boolean {
  if (reviewQuestions.length === 0) return true;
  return reviewQuestions.every(
    (question) =>
      progress.reviewCorrectIds.includes(question.id) ||
      (progress.reviewHeldIds.includes(question.id) &&
        isLockedToday(question.id)),
  );
}

export function currentReviewQuestionId(
  progress: GradedLessonProgress,
  reviewQuestions: { id: string }[],
  isLockedToday: (questionId: string) => boolean,
): string | null {
  if (progress.phase !== "review") return null;
  for (const question of reviewQuestions) {
    if (progress.reviewCorrectIds.includes(question.id)) continue;
    if (
      progress.reviewHeldIds.includes(question.id) &&
      isLockedToday(question.id)
    ) {
      continue;
    }
    return question.id;
  }
  return null;
}

export function currentMcQuestionId(progress: GradedLessonProgress): string | null {
  if (progress.phase !== "multiple-choice") return null;
  if (progress.mcIndex >= progress.mcQuestionIds.length) return null;
  return progress.mcQuestionIds[progress.mcIndex] ?? null;
}

export function currentFibQuestionId(progress: GradedLessonProgress): string | null {
  if (progress.phase !== "fill-in-blank") return null;
  if (progress.fibIndex >= progress.fibQuestionIds.length) return null;
  return progress.fibQuestionIds[progress.fibIndex] ?? null;
}

export function currentExtraQuestionId(progress: GradedLessonProgress): string | null {
  if (progress.phase !== "extra-practice") return null;
  if (progress.extraIndex >= progress.extraQuestionIds.length) return null;
  return progress.extraQuestionIds[progress.extraIndex] ?? null;
}
