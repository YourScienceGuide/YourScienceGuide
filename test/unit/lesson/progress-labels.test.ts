import { describe, expect, it } from "vitest";

import { lessonStepLabel } from "@/lib/lesson/progress-labels";

describe("lessonStepLabel", () => {
  it("labels in-progress and complete states", () => {
    expect(lessonStepLabel(0, 3, false)).toBe("Question 1 of 3");
    expect(lessonStepLabel(2, 3, false)).toBe("Question 3 of 3");
  });

  it("labels completion", () => {
    expect(lessonStepLabel(2, 3, true)).toBe("Lesson complete · 3 of 3");
  });
});
