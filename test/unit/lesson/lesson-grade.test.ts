import { describe, expect, it } from "vitest";

import {
  calculateLessonScore,
  applyMcResult,
  INITIAL_GRADED_LESSON_PROGRESS,
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
