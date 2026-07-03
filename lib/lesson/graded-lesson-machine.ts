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

export type GradedLessonProgress = {
  phase: GradedLessonPhase;
  reviewCorrectIds: string[];
  mcQuestionIds: string[];
  mcIndex: number;
  mcCorrectCount: number;
  mcCorrectIds: string[];
  fibQuestionIds: string[];
  fibCorrectIds: string[];
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
  mcQuestionIds: [],
  mcIndex: 0,
  mcCorrectCount: 0,
  mcCorrectIds: [],
  fibQuestionIds: [],
  fibCorrectIds: [],
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
): GradedLessonProgress {
  const base = { ...INITIAL_GRADED_LESSON_PROGRESS, ...stored };
  const mcQuestionIds =
    base.mcQuestionIds.length > 0
      ? base.mcQuestionIds
      : plan.multipleChoice.map((q) => q.id);
  const fibQuestionIds =
    base.fibQuestionIds.length > 0
      ? base.fibQuestionIds
      : plan.fillInBlank.map((q) => q.id);
  const extraQuestionIds =
    base.extraQuestionIds.length > 0
      ? base.extraQuestionIds
      : plan.extraPractice.map((q) => q.id);

  let phase = base.phase;
  if (phase === "review" && base.reviewCorrectIds.length >= plan.review.length && plan.review.length > 0) {
    phase = "multiple-choice";
  }
  if (phase === "multiple-choice" && isMcPhaseComplete(base, plan.multipleChoice.length)) {
    phase = plan.fillInBlank.length > 0 ? "fill-in-blank" : nextAfterFib(plan);
  }
  if (phase === "fill-in-blank" && base.fibCorrectIds.length >= plan.fillInBlank.length && plan.fillInBlank.length > 0) {
    phase = nextAfterFib(plan);
  }
  if (phase === "extra-practice" && base.extraCorrectIds.length >= plan.extraPractice.length && plan.extraPractice.length > 0) {
    phase = plan.freeResponse ? "free-response" : "complete";
  }
  if (phase === "free-response" && base.freeResponseSubmitted) {
    phase = "complete";
  }
  if (plan.review.length === 0 && phase === "review") {
    phase = plan.multipleChoice.length > 0 ? "multiple-choice" : nextAfterFib(plan);
  }

  const problemsSolved = countProblemsSolved({
    ...base,
    mcQuestionIds,
    fibQuestionIds,
    extraQuestionIds,
  });

  let hydratedProgress: GradedLessonProgress = {
    ...base,
    phase,
    mcQuestionIds,
    fibQuestionIds,
    extraQuestionIds,
    freeResponseQuestionId:
      base.freeResponseQuestionId ?? plan.freeResponse?.id ?? null,
    problemsSolved,
    graduated: base.graduated,
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
  const phase =
    reviewCorrectIds.length >= reviewTotal && reviewTotal > 0
      ? "multiple-choice"
      : progress.phase;
  return { ...progress, reviewCorrectIds, phase };
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

export function reviewPhaseComplete(
  progress: GradedLessonProgress,
  reviewTotal: number,
): boolean {
  return reviewTotal === 0 || progress.reviewCorrectIds.length >= reviewTotal;
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
