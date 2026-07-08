import { describe, expect, it } from "vitest";

import { INITIAL_GRADED_LESSON_PROGRESS } from "@/lib/lesson/graded-lesson-machine";
import {
  getGradedLessonStatus,
  gradedLessonCompletionPercent,
  gradedLessonProgressPercent,
  hasGradedLessonActivity,
} from "@/lib/student/graded-lesson-progress";
import { DEFAULT_GRADING_RUBRIC } from "@/lib/lesson/lesson-grade-config";
import { calculateLessonScore } from "@/lib/lesson/graded-lesson-machine";

describe("graded lesson progress status", () => {
  it("treats unanswered lessons as not started", () => {
    expect(getGradedLessonStatus(null)).toBe("not_started");
    expect(hasGradedLessonActivity(INITIAL_GRADED_LESSON_PROGRESS)).toBe(false);
  });

  it("treats partial graded progress as in progress", () => {
    expect(
      getGradedLessonStatus({
        ...INITIAL_GRADED_LESSON_PROGRESS,
        reviewCorrectIds: ["review-1"],
      }),
    ).toBe("in_progress");
  });

  it("treats completed phase as complete", () => {
    expect(
      getGradedLessonStatus({
        ...INITIAL_GRADED_LESSON_PROGRESS,
        phase: "complete",
        reviewCorrectIds: ["review-1"],
      }),
    ).toBe("complete");
  });

  it("reports completion percent from lesson phase progress, not grade", () => {
    const progress = {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice" as const,
      mcIndex: 3,
      mcCorrectIds: [],
      mcCorrectCount: 0,
    };

    expect(gradedLessonCompletionPercent(progress)).toBeGreaterThan(0);
    expect(calculateLessonScore(progress, DEFAULT_GRADING_RUBRIC).percent).toBe(0);
    expect(gradedLessonProgressPercent(progress, DEFAULT_GRADING_RUBRIC)).toBe(
      gradedLessonCompletionPercent(progress),
    );
  });

  it("returns 100% completion when the lesson phase is complete", () => {
    expect(
      gradedLessonCompletionPercent({
        ...INITIAL_GRADED_LESSON_PROGRESS,
        phase: "complete",
      }),
    ).toBe(100);
  });
});
