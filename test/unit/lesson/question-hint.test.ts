import { describe, expect, it } from "vitest";

import { getQuestionHint } from "@/lib/lesson/question-hint";
import type { LessonQuestion } from "@/lib/lesson/types";

const base: LessonQuestion = {
  id: "q1",
  type: "short-answer",
  prompt: "What is H2O?",
  acceptedAnswers: ["water"],
};

describe("getQuestionHint", () => {
  it("returns the question hint when set", () => {
    expect(getQuestionHint({ ...base, hint: "Think about what you drink." })).toBe(
      "Think about what you drink.",
    );
  });

  it("falls back when hint is missing or blank", () => {
    expect(getQuestionHint(base)).toBe(
      "Review the lesson material, then try again.",
    );
    expect(getQuestionHint({ ...base, hint: "   " })).toBe(
      "Review the lesson material, then try again.",
    );
  });
});
