import { describe, expect, it } from "vitest";

import { lessonStepLabel } from "@/lib/lesson/progress-labels";

describe("lessonStepLabel", () => {
  it("shows question progress", () => {
    expect(lessonStepLabel(0, false)).toBe("Question 1 of 3");
    expect(lessonStepLabel(2, false)).toBe("Question 3 of 3");
  });

  it("shows completion label", () => {
    expect(lessonStepLabel(2, true)).toBe("Lesson complete · 3 of 3");
  });
});
