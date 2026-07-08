import { describe, expect, it } from "vitest";

import {
  afterQuestionAttempt,
  getMaxAttempts,
} from "@/lib/lesson/question-attempt-limits";
import {
  applyFibHeldForToday,
  applyMcResult,
  applyReviewHeldForToday,
  canAccessLessonDuringReview,
  currentFibQuestionId,
  currentMcQuestionId,
  currentReviewQuestionId,
  INITIAL_GRADED_LESSON_PROGRESS,
  reviewPhaseComplete,
} from "@/lib/lesson/graded-lesson-machine";
import { DEFAULT_GRADING_RUBRIC } from "@/lib/lesson/lesson-grade-config";
import {
  canAccessLessonDuringReview,
  canAccessStandaloneReview,
  applyQuestionHeldForToday,
  INITIAL_LESSON_STATE,
  withAssignmentCount,
} from "@/lib/lesson/state-machine";
import type { LessonQuestion } from "@/lib/lesson/types";
import {
  makeFillInBlank,
  makeMultipleChoice,
  makeShortAnswer,
} from "../../helpers/factories";

const TODAY = "2026-07-05";

function exhaustAttempts(question: LessonQuestion, today = TODAY) {
  const maxAttempts = getMaxAttempts(question);
  if (maxAttempts === null) {
    return { maxAttempts, record: null, isLocked: false };
  }

  let record = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    record = afterQuestionAttempt(record, maxAttempts, false, today);
  }

  return {
    maxAttempts,
    record,
    isLocked: record?.exhaustedOnDay === today,
  };
}

describe("attempt limits by question type", () => {
  it("limits multiple-choice, fill-in-blank, and short-answer attempts", () => {
    expect(
      exhaustAttempts(makeMultipleChoice({ options: ["A", "B", "C", "D"] }))
        .isLocked,
    ).toBe(true);
    expect(exhaustAttempts(makeFillInBlank()).isLocked).toBe(true);
    expect(exhaustAttempts(makeShortAnswer()).isLocked).toBe(true);
  });

  it("does not limit long-answer questions", () => {
    const longAnswer: LessonQuestion = {
      id: "fr-1",
      type: "long-answer",
      prompt: "Explain photosynthesis.",
      rubric: "depth",
    };
    expect(getMaxAttempts(longAnswer)).toBeNull();
    expect(exhaustAttempts(longAnswer).isLocked).toBe(false);
  });
});

describe("graded lesson review exhaustion", () => {
  const reviewQuestions = [
    { id: "rev-mc" },
    { id: "rev-fib" },
    { id: "rev-sa" },
  ];
  const isLockedToday = (id: string) => id === "rev-mc";

  it("unlocks lesson access while the active review question is locked", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "review" as const,
    };

    expect(canAccessLessonDuringReview(progress, reviewQuestions, () => false)).toBe(
      false,
    );
    expect(canAccessLessonDuringReview(progress, reviewQuestions, isLockedToday)).toBe(
      true,
    );
  });

  it("advances to the next review question after holding the current one", () => {
    let progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "review" as const,
    };

    expect(currentReviewQuestionId(progress, reviewQuestions, isLockedToday)).toBe(
      "rev-mc",
    );

    progress = applyReviewHeldForToday(progress, "rev-mc");

    expect(currentReviewQuestionId(progress, reviewQuestions, isLockedToday)).toBe(
      "rev-fib",
    );
    expect(reviewPhaseComplete(progress, reviewQuestions, isLockedToday)).toBe(false);
  });

  it("completes review after all questions are held for today", () => {
    let progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "review" as const,
    };

    progress = applyReviewHeldForToday(progress, "rev-mc");
    progress = applyReviewHeldForToday(progress, "rev-fib");
    progress = applyReviewHeldForToday(progress, "rev-sa");

    expect(reviewPhaseComplete(progress, reviewQuestions, () => true)).toBe(true);
    expect(currentReviewQuestionId(progress, reviewQuestions, () => true)).toBeNull();
    expect(canAccessLessonDuringReview(progress, reviewQuestions, () => true)).toBe(
      true,
    );
  });
});

describe("graded lesson multiple-choice exhaustion", () => {
  it("advances to the next question without marking it correct", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice" as const,
      mcQuestionIds: ["mc-1", "mc-2"],
      mcIndex: 0,
      fibQuestionIds: ["fib-1"],
    };

    const next = applyMcResult(
      progress,
      "mc-1",
      false,
      DEFAULT_GRADING_RUBRIC,
      2,
    );

    expect(currentMcQuestionId(next)).toBe("mc-2");
    expect(next.mcCorrectIds).toEqual([]);
    expect(next.phase).toBe("multiple-choice");
  });

  it("moves into fill-in-blank after exhausting the final MC question", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice" as const,
      mcQuestionIds: ["mc-1"],
      mcIndex: 0,
      fibQuestionIds: ["fib-1"],
    };

    const next = applyMcResult(
      progress,
      "mc-1",
      false,
      DEFAULT_GRADING_RUBRIC,
      1,
    );

    expect(currentMcQuestionId(next)).toBeNull();
    expect(next.phase).toBe("fill-in-blank");
  });
});

describe("graded lesson fill-in-blank exhaustion", () => {
  it("advances to the next fill-in-blank question after holding the current one", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "fill-in-blank" as const,
      fibQuestionIds: ["fib-1", "fib-2"],
      fibIndex: 0,
      extraQuestionIds: ["extra-1"],
    };

    const next = applyFibHeldForToday(
      progress,
      "fib-1",
      2,
      true,
      false,
    );

    expect(currentFibQuestionId(next)).toBe("fib-2");
    expect(next.fibCorrectIds).toEqual([]);
    expect(next.fibHeldIds).toEqual(["fib-1"]);
    expect(next.phase).toBe("fill-in-blank");
  });

  it("moves into extra practice after exhausting the final fill-in-blank question", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "fill-in-blank" as const,
      fibQuestionIds: ["fib-1"],
      fibIndex: 0,
      extraQuestionIds: ["extra-1"],
    };

    const next = applyFibHeldForToday(
      progress,
      "fib-1",
      1,
      true,
      false,
    );

    expect(currentFibQuestionId(next)).toBeNull();
    expect(next.phase).toBe("extra-practice");
  });
});

describe("standalone review section exhaustion", () => {
  const lesson = [{ id: "q1" }, { id: "q2" }];
  const baseState = withAssignmentCount(INITIAL_LESSON_STATE, lesson.length);
  const isLockedToday = (id: string) => id === "q1";

  it("unlocks lesson access while the active question is locked", () => {
    expect(canAccessStandaloneReview(baseState, lesson, () => false)).toBe(false);
    expect(canAccessStandaloneReview(baseState, lesson, isLockedToday)).toBe(true);
  });

  it("advances to the next question after holding the exhausted one", () => {
    const held = hydrateLessonState(
      applyQuestionHeldForToday(baseState, "q1"),
      lesson,
      isLockedToday,
    );

    expect(resolveActiveQuestionIndex(lesson, held, isLockedToday)).toBe(1);
    expect(canAccessStandaloneReview(held, lesson, isLockedToday)).toBe(false);
  });

  it("unlocks lesson access when the active question is exhausted", () => {
    const lockedToday = () => true;
    const afterHold = hydrateLessonState(
      applyQuestionHeldForToday(baseState, "q1"),
      lesson,
      lockedToday,
    );

    expect(resolveActiveQuestionIndex(lesson, afterHold, lockedToday)).toBe(1);
    expect(canAccessStandaloneReview(afterHold, lesson, lockedToday)).toBe(true);
  });

  it("still allows lesson access when only held questions remain", () => {
    const held = hydrateLessonState(
      {
        ...baseState,
        heldQuestionIds: ["q1", "q2"],
      },
      lesson,
      () => true,
    );

    expect(resolveActiveQuestionIndex(lesson, held, () => true)).toBeNull();
    expect(canAccessStandaloneReview(held, lesson, () => true)).toBe(true);
  });
});

describe("graded lesson extra practice and free response", () => {
  it("still defines attempt limits for short-answer but extra practice skips them in the UI", () => {
    const shortAnswer = makeShortAnswer();
    expect(getMaxAttempts(shortAnswer)).toBe(2);
    expect(exhaustAttempts(shortAnswer).isLocked).toBe(true);
  });

  it("does not lock long-answer free response questions", () => {
    const longAnswer: LessonQuestion = {
      id: "fr-1",
      type: "long-answer",
      prompt: "Explain photosynthesis.",
      rubric: "depth",
    };
    expect(getMaxAttempts(longAnswer)).toBeNull();
    expect(exhaustAttempts(longAnswer).isLocked).toBe(false);
  });
});
