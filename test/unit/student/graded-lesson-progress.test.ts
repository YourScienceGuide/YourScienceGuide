import { describe, expect, it } from "vitest";

import { INITIAL_GRADED_LESSON_PROGRESS } from "@/lib/lesson/graded-lesson-machine";
import {
  getGradedLessonStatus,
  hasGradedLessonActivity,
} from "@/lib/student/graded-lesson-progress";

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
});
