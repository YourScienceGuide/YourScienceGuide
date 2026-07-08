import { describe, expect, it } from "vitest";

import {
  calculateLessonCompletionPercent,
  calculateLessonScore,
  applyMcResult,
  applyReviewHeldForToday,
  currentReviewQuestionId,
  INITIAL_GRADED_LESSON_PROGRESS,
  isGradedLessonPhasePast,
  reviewPhaseComplete,
} from "@/lib/lesson/graded-lesson-machine";
import { DEFAULT_GRADING_RUBRIC } from "@/lib/lesson/lesson-grade-config";
import { maxLessonScore } from "@/lib/lesson/lesson-grade-config";

describe("lesson grade config", () => {
  it("defaults to 50 point max score", () => {
    expect(maxLessonScore(DEFAULT_GRADING_RUBRIC)).toBe(50);
  });
});

describe("graded lesson machine", () => {
  it("advances to the next MC question when attempts are exhausted", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice" as const,
      mcQuestionIds: ["mc-1", "mc-2", "mc-3"],
      mcIndex: 0,
      mcCorrectCount: 0,
      mcCorrectIds: [],
      fibQuestionIds: ["fib-1"],
    };

    const next = applyMcResult(progress, "mc-1", false, DEFAULT_GRADING_RUBRIC, 3);

    expect(next.mcIndex).toBe(1);
    expect(next.mcCorrectCount).toBe(0);
    expect(next.mcCorrectIds).toEqual([]);
    expect(next.phase).toBe("multiple-choice");
  });

  it("skips held review questions and completes the review phase", () => {
    const reviewQuestions = [{ id: "rev-1" }, { id: "rev-2" }];
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "review" as const,
      reviewHeldIds: ["rev-1"],
      fibQuestionIds: ["fib-1"],
    };

    expect(
      currentReviewQuestionId(progress, reviewQuestions, (id) => id === "rev-1"),
    ).toBe("rev-2");
    expect(
      reviewPhaseComplete(progress, reviewQuestions, (id) => id === "rev-1"),
    ).toBe(false);

    const allHeld = applyReviewHeldForToday(progress, "rev-2");
    expect(
      reviewPhaseComplete(allHeld, reviewQuestions, () => true),
    ).toBe(true);
  });

  it("calculates lesson completion from work done, not points earned", () => {
    const plan = {
      review: [{ id: "rev-1" }, { id: "rev-2" }],
      multipleChoice: [{ id: "mc-1" }, { id: "mc-2" }],
      fillInBlank: [{ id: "fib-1" }],
      extraPractice: [],
      freeResponse: null,
    };
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice" as const,
      reviewCorrectIds: ["rev-1", "rev-2"],
      mcIndex: 1,
      mcCorrectIds: [],
      mcCorrectCount: 0,
    };

    expect(calculateLessonCompletionPercent(progress, plan, () => false)).toBe(60);
    expect(calculateLessonScore(progress, DEFAULT_GRADING_RUBRIC).percent).toBe(4);
  });

  it("returns 100% completion when the lesson phase is complete", () => {
    const plan = {
      review: [{ id: "rev-1" }],
      multipleChoice: [{ id: "mc-1" }],
      fillInBlank: [],
      extraPractice: [],
      freeResponse: null,
    };

    expect(
      calculateLessonCompletionPercent(
        { ...INITIAL_GRADED_LESSON_PROGRESS, phase: "complete" },
        plan,
        () => true,
      ),
    ).toBe(100);
  });

  it("counts held review questions toward completion when locked today", () => {
    const plan = {
      review: [{ id: "rev-1" }, { id: "rev-2" }],
      multipleChoice: [],
      fillInBlank: [],
      extraPractice: [],
      freeResponse: null,
    };
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "review" as const,
      reviewHeldIds: ["rev-1"],
    };

    expect(
      calculateLessonCompletionPercent(progress, plan, (id) => id === "rev-1"),
    ).toBe(50);
  });

  it("identifies phases that are already behind the current phase", () => {
    expect(isGradedLessonPhasePast("fill-in-blank", "review")).toBe(true);
    expect(isGradedLessonPhasePast("fill-in-blank", "multiple-choice")).toBe(true);
    expect(isGradedLessonPhasePast("fill-in-blank", "fill-in-blank")).toBe(false);
    expect(isGradedLessonPhasePast("complete", "free-response")).toBe(true);
  });

  it("stops MC phase after 9 correct", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice" as const,
      mcQuestionIds: Array.from({ length: 15 }, (_, i) => `mc-${i}`),
      mcIndex: 0,
      mcCorrectCount: 8,
      mcCorrectIds: Array.from({ length: 8 }, (_, i) => `mc-${i}`),
      fibQuestionIds: ["fib-1"],
    };

    const next = applyMcResult(progress, "mc-8", true, DEFAULT_GRADING_RUBRIC, 15);
    expect(next.mcCorrectCount).toBe(9);
    expect(next.phase).toBe("fill-in-blank");
  });

  it("calculates earned points from progress", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      reviewCorrectIds: ["r1", "r2", "r3", "r4"],
      mcCorrectIds: Array.from({ length: 9 }, (_, i) => `mc-${i}`),
      fibCorrectIds: ["f1", "f2", "f3", "f4"],
      extraCorrectIds: ["e1", "e2", "e3", "e4", "e5"],
      freeResponseParentScore: 8,
    };
    const score = calculateLessonScore(progress, DEFAULT_GRADING_RUBRIC);
    expect(score.review).toBe(4);
    expect(score.multipleChoice).toBe(18);
    expect(score.fillInBlank).toBe(8);
    expect(score.extraPractice).toBe(10);
    expect(score.freeResponse).toBe(8);
    expect(score.earned).toBe(48);
    expect(score.percent).toBe(96);
  });
});
