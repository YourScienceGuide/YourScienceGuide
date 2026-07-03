import { describe, expect, it } from "vitest";

import {
  applyCorrectAnswer,
  applyIncorrectAnswer,
  applyQuestionHeldForToday,
  clearFeedback,
  clearToast,
  hydrateLessonState,
  INITIAL_LESSON_STATE,
  progressPercent,
  resolveActiveQuestionIndex,
  withAssignmentCount,
} from "@/lib/lesson/state-machine";

const lesson = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];

describe("lesson state machine", () => {
  const threeQuestionState = withAssignmentCount(INITIAL_LESSON_STATE, 3);

  it("starts at zero progress", () => {
    expect(progressPercent(threeQuestionState)).toBe(0);
  });

  it("advances on correct answers", () => {
    const afterFirst = applyCorrectAnswer(threeQuestionState, "q1");
    expect(afterFirst.completedCount).toBe(1);
    expect(afterFirst.completedQuestionIds).toEqual(["q1"]);
    expect(afterFirst.difficulty).toBe(2);
    expect(afterFirst.toast).toContain("Correct");
  });

  it("completes lesson on final correct answer", () => {
    let state = threeQuestionState;
    state = applyCorrectAnswer(state, "q1");
    state = applyCorrectAnswer(state, "q2");
    state = applyCorrectAnswer(state, "q3");

    expect(state.isComplete).toBe(true);
    expect(state.completedCount).toBe(3);
    expect(progressPercent(state)).toBe(100);
  });

  it("shows retry feedback on incorrect answer without advancing", () => {
    const state = applyIncorrectAnswer(threeQuestionState);
    expect(state.feedbackTone).toBe("retry");
    expect(state.completedCount).toBe(0);
    expect(state.questionIndex).toBe(0);
  });

  it("clears toast and feedback", () => {
    const withToast = { ...threeQuestionState, toast: "Hi" };
    expect(clearToast(withToast).toast).toBeNull();

    const withFeedback = {
      ...threeQuestionState,
      feedback: "Oops",
      feedbackTone: "retry" as const,
    };
    const cleared = clearFeedback(withFeedback);
    expect(cleared.feedback).toBeNull();
    expect(cleared.feedbackTone).toBeNull();
  });

  it("skips held questions when resolving the active question", () => {
    const state = hydrateLessonState(
      {
        ...threeQuestionState,
        completedQuestionIds: [],
        heldQuestionIds: ["q1"],
      },
      lesson,
      (questionId) => questionId === "q1",
    );

    expect(resolveActiveQuestionIndex(lesson, state, () => true)).toBe(1);
    expect(state.questionIndex).toBe(1);
  });

  it("returns to held questions after the calendar day changes", () => {
    const state = hydrateLessonState(
      {
        ...threeQuestionState,
        completedQuestionIds: ["q2"],
        heldQuestionIds: ["q1"],
      },
      lesson,
      () => false,
    );

    expect(resolveActiveQuestionIndex(lesson, state, () => false)).toBe(0);
    expect(state.heldQuestionIds).toEqual([]);
  });

  it("marks a question held for today without completing it", () => {
    const held = applyQuestionHeldForToday(threeQuestionState, "q1");

    expect(held.completedQuestionIds).toEqual([]);
    expect(held.heldQuestionIds).toEqual(["q1"]);
    expect(held.toast).toContain("on hold until tomorrow");
  });
});
