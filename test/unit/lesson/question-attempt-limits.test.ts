import { describe, expect, it } from "vitest";

import {
  afterQuestionAttempt,
  attemptsRemaining,
  getCalendarDayKey,
  getMaxAttempts,
  getQuestionAttemptState,
} from "@/lib/lesson/question-attempt-limits";
import type { LessonQuestion } from "@/lib/lesson/types";

const mc = (options: string[]): LessonQuestion => ({
  id: "q1",
  type: "multiple-choice",
  prompt: "Pick one",
  options,
  correctIndex: 0,
});

describe("getMaxAttempts", () => {
  it("returns 1 for true/false (2 options)", () => {
    expect(getMaxAttempts(mc(["True", "False"]))).toBe(1);
  });

  it("returns 2 for four-option multiple choice", () => {
    expect(getMaxAttempts(mc(["A", "B", "C", "D"]))).toBe(2);
  });

  it("returns 2 for three-option multiple choice", () => {
    expect(getMaxAttempts(mc(["A", "B", "C"]))).toBe(2);
  });

  it("returns 2 for short-answer and fill-in-the-blank", () => {
    expect(
      getMaxAttempts({
        id: "q2",
        type: "short-answer",
        prompt: "x?",
        acceptedAnswers: ["1"],
      }),
    ).toBe(2);
    expect(
      getMaxAttempts({
        id: "q3",
        type: "fill-in-the-blank",
        prompt: "___",
        blanks: [["a"]],
      }),
    ).toBe(2);
  });

  it("returns null for long-answer", () => {
    expect(
      getMaxAttempts({
        id: "q4",
        type: "long-answer",
        prompt: "Explain",
        rubric: "depth",
      }),
    ).toBeNull();
  });
});

describe("calendar-day attempt state", () => {
  const today = "2026-06-20";
  const tomorrow = "2026-06-21";

  it("resets attempts on a new calendar day", () => {
    const record = afterQuestionAttempt(
      null,
      2,
      false,
      today,
    );
    expect(getQuestionAttemptState(record, tomorrow)).toEqual({
      attemptsUsed: 0,
      isLocked: false,
    });
  });

  it("locks after exhausting tries on the same day", () => {
    const first = afterQuestionAttempt(null, 2, false, today);
    const second = afterQuestionAttempt(first, 2, false, today);

    expect(second.exhaustedOnDay).toBe(today);
    expect(getQuestionAttemptState(second, today)).toEqual({
      attemptsUsed: 2,
      isLocked: true,
    });
  });

  it("unlocks the day after exhaustion", () => {
    const exhausted = afterQuestionAttempt(
      afterQuestionAttempt(null, 1, false, today),
      1,
      false,
      today,
    );

    expect(getQuestionAttemptState(exhausted, tomorrow)).toEqual({
      attemptsUsed: 0,
      isLocked: false,
    });
  });

  it("resets on correct answer", () => {
    const wrong = afterQuestionAttempt(null, 2, false, today);
    const correct = afterQuestionAttempt(wrong, 2, true, today);

    expect(correct).toEqual({
      attemptsUsed: 0,
      lastAttemptDay: today,
      exhaustedOnDay: null,
    });
  });
});

describe("attemptsRemaining", () => {
  it("counts down to zero", () => {
    expect(attemptsRemaining(0, 2)).toBe(2);
    expect(attemptsRemaining(1, 2)).toBe(1);
    expect(attemptsRemaining(2, 2)).toBe(0);
  });
});

describe("getCalendarDayKey", () => {
  it("uses local calendar date", () => {
    const key = getCalendarDayKey(new Date(2026, 5, 20, 23, 59));
    expect(key).toBe("2026-06-20");
  });
});
