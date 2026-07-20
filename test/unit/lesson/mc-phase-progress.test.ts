import { describe, expect, it } from "vitest";

import {
  isMcAnswerAllMode,
  mcPhaseDescription,
  remainingCorrectNeeded,
} from "@/lib/lesson/mc-phase-copy";

describe("mc phase copy", () => {
  it("uses answer-all language when the bank is smaller than the target", () => {
    expect(isMcAnswerAllMode(5, 9)).toBe(true);
    expect(isMcAnswerAllMode(9, 9)).toBe(false);
    expect(isMcAnswerAllMode(15, 9)).toBe(false);
    expect(mcPhaseDescription(5, 9)).toBe(
      "Work through 5 questions. Answer all 5 questions.",
    );
  });

  it("keeps target-correct language when the bank is large enough", () => {
    expect(mcPhaseDescription(13, 9)).toBe(
      "Work through 13 questions. Answer 9 correctly to finish this section.",
    );
  });

  it("returns how many more correct answers are needed", () => {
    expect(remainingCorrectNeeded(3, 9)).toBe(6);
    expect(remainingCorrectNeeded(9, 9)).toBe(0);
    expect(remainingCorrectNeeded(12, 9)).toBe(0);
  });
});
