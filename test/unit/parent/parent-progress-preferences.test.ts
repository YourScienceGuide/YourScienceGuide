import { beforeEach, describe, expect, it } from "vitest";

import { createDefaultStore } from "@/lib/admin/content-store";
import {
  readParentProgressPreferences,
  resolveParentProgressCourseId,
  writeParentProgressPreferences,
} from "@/lib/parent/parent-progress-preferences";

describe("parent progress preferences (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores the last selected course for a parent user", () => {
    const store = createDefaultStore();
    const userId = "user_parent_1";
    const courseId = store.courses[1]?.id ?? store.courses[0].id;

    writeParentProgressPreferences(userId, { courseId });

    expect(
      resolveParentProgressCourseId(store, readParentProgressPreferences(userId)),
    ).toBe(courseId);
  });

  it("falls back when a stored course was deleted", () => {
    const store = createDefaultStore();

    expect(
      resolveParentProgressCourseId(store, { courseId: "missing-course" }),
    ).toBe(store.courses[0].id);
  });
});
