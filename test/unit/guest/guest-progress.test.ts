import { beforeEach, describe, expect, it } from "vitest";

import {
  canGuestOpenLesson,
  getGuestCompletedCount,
  GUEST_LESSON_LIMIT,
  guestLessonKey,
  hasGuestCompletedLesson,
  recordGuestLessonComplete,
} from "@/lib/guest/guest-progress";

describe("guest progress", () => {
  const courseId = "biology-year-1";

  beforeEach(() => {
    localStorage.clear();
  });

  it("builds stable lesson keys", () => {
    expect(guestLessonKey(courseId, "scientific-method")).toBe(
      "biology-year-1:scientific-method",
    );
  });

  it("allows preview lessons until limit reached", () => {
    expect(canGuestOpenLesson(courseId, "scientific-method")).toBe(true);
    expect(canGuestOpenLesson(courseId, "cells-introduction")).toBe(false);
  });

  it("records completions idempotently", () => {
    expect(recordGuestLessonComplete(courseId, "scientific-method")).toBe(1);
    expect(recordGuestLessonComplete(courseId, "scientific-method")).toBe(1);
    expect(getGuestCompletedCount()).toBe(1);
    expect(hasGuestCompletedLesson(courseId, "scientific-method")).toBe(true);
  });

  it("blocks new preview lessons after limit", () => {
    recordGuestLessonComplete(courseId, "scientific-method");
    recordGuestLessonComplete(courseId, "lab-safety");
    expect(getGuestCompletedCount()).toBe(GUEST_LESSON_LIMIT);
    expect(canGuestOpenLesson(courseId, "scientific-method")).toBe(true);
  });
});
