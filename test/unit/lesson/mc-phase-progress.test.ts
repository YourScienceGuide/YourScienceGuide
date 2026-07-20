import { describe, expect, it } from "vitest";

import { remainingCorrectNeeded } from "@/components/lesson/mc-phase-progress";

describe("remainingCorrectNeeded", () => {
  it("returns how many more correct answers are needed", () => {
    expect(remainingCorrectNeeded(3, 9)).toBe(6);
    expect(remainingCorrectNeeded(9, 9)).toBe(0);
    expect(remainingCorrectNeeded(12, 9)).toBe(0);
  });
});
