import {
  canGuestOpenLesson,
} from "@/lib/guest/guest-progress";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";

describe("guest progress", () => {
  const previewLesson: Pick<CurriculumLesson, "id" | "accessTier"> = {
    id: "scientific-method",
    accessTier: "preview",
  };
  const subscriberLesson: Pick<CurriculumLesson, "id" | "accessTier"> = {
    id: "cells-introduction",
    accessTier: "subscriber",
  };

  it("allows preview lessons", () => {
    expect(canGuestOpenLesson(previewLesson)).toBe(true);
    expect(canGuestOpenLesson(subscriberLesson)).toBe(false);
  });

  it("treats missing lesson metadata as locked", () => {
    expect(canGuestOpenLesson(null)).toBe(false);
  });
});
