import { describe, expect, it } from "vitest";

import {
  GUEST_PREVIEW_LESSON_IDS,
  getLessonTier,
  isAdvancedLesson,
  isPreviewLesson,
} from "@/lib/guest/lesson-tiers";

describe("guest lesson tiers", () => {
  it("marks preview lessons", () => {
    for (const id of GUEST_PREVIEW_LESSON_IDS) {
      expect(getLessonTier(id)).toBe("preview");
      expect(isPreviewLesson(id)).toBe(true);
      expect(isAdvancedLesson(id)).toBe(false);
    }
  });

  it("marks other lessons as advanced", () => {
    expect(getLessonTier("cells-introduction")).toBe("advanced");
    expect(isAdvancedLesson("cells-introduction")).toBe(true);
  });
});
