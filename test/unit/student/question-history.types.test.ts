import { describe, expect, it } from "vitest";

import {
  excerptPrompt,
  summarizeAttempts,
} from "@/lib/student/question-history.types";

describe("question history helpers", () => {
  it("summarizes attempt accuracy", () => {
    expect(summarizeAttempts([])).toEqual({
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracyPercent: 0,
    });

    expect(
      summarizeAttempts([
        { isCorrect: true },
        { isCorrect: true },
        { isCorrect: false },
      ]),
    ).toEqual({
      totalAttempts: 3,
      correctAttempts: 2,
      incorrectAttempts: 1,
      accuracyPercent: 67,
    });
  });

  it("excerpts long prompts", () => {
    const long = "word ".repeat(30).trim();
    const excerpt = excerptPrompt(long, 40);
    expect(excerpt.length).toBeLessThanOrEqual(40);
    expect(excerpt.endsWith("…")).toBe(true);
  });

  it("normalizes whitespace in excerpts", () => {
    expect(excerptPrompt("  many   spaces  ")).toBe("many spaces");
  });
});
