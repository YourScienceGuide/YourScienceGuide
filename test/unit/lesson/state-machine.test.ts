import { describe, expect, it } from "vitest";

import {
  applyCorrectAnswer,
  applyIncorrectAnswer,
  clearFeedback,
  clearToast,
  INITIAL_LESSON_STATE,
  progressPercent,
} from "@/lib/lesson/state-machine";

describe("lesson state machine", () => {
  it("starts at zero progress", () => {
    expect(progressPercent(INITIAL_LESSON_STATE)).toBe(0);
  });

  it("advances on correct answers", () => {
    const afterFirst = applyCorrectAnswer(INITIAL_LESSON_STATE);
    expect(afterFirst.completedCount).toBe(1);
    expect(afterFirst.questionIndex).toBe(1);
    expect(afterFirst.difficulty).toBe(2);
    expect(afterFirst.toast).toContain("Correct");
  });

  it("completes lesson on final correct answer", () => {
    let state = INITIAL_LESSON_STATE;
    state = applyCorrectAnswer(state);
    state = applyCorrectAnswer(state);
    state = applyCorrectAnswer(state);

    expect(state.isComplete).toBe(true);
    expect(state.completedCount).toBe(3);
    expect(progressPercent(state)).toBe(100);
  });

  it("shows retry feedback on incorrect answer without advancing", () => {
    const state = applyIncorrectAnswer(INITIAL_LESSON_STATE);
    expect(state.feedbackTone).toBe("retry");
    expect(state.completedCount).toBe(0);
    expect(state.questionIndex).toBe(0);
  });

  it("clears toast and feedback", () => {
    const withToast = { ...INITIAL_LESSON_STATE, toast: "Hi" };
    expect(clearToast(withToast).toast).toBeNull();

    const withFeedback = {
      ...INITIAL_LESSON_STATE,
      feedback: "Oops",
      feedbackTone: "retry" as const,
    };
    const cleared = clearFeedback(withFeedback);
    expect(cleared.feedback).toBeNull();
    expect(cleared.feedbackTone).toBeNull();
  });
});
