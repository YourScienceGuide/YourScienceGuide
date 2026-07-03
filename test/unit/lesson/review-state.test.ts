import { describe, expect, it } from "vitest";

import {
  applyReviewCorrectAnswer,
  applyReviewHeldForToday,
} from "@/lib/lesson/review-state";
import { INITIAL_LESSON_STATE } from "@/lib/lesson/state-machine";

describe("review state", () => {
  it("uses review-specific completion toast", () => {
    const state = {
      ...INITIAL_LESSON_STATE,
      assignmentCount: 1,
    };
    const next = applyReviewCorrectAnswer(state, "q1");
    expect(next.isComplete).toBe(true);
    expect(next.toast).toContain("Review complete");
  });

  it("uses review-specific held toast", () => {
    const next = applyReviewHeldForToday(INITIAL_LESSON_STATE, "q1");
    expect(next.toast).toContain("review question");
  });
});
