import { beforeEach, describe, expect, it } from "vitest";

import { createDefaultStore } from "@/lib/admin/content-store";
import {
  readAdminPreferences,
  resolveAdminWorkspace,
  selectionAfterCourseChange,
  selectionAfterLessonChange,
  writeAdminPreferences,
} from "@/lib/admin/admin-preferences";

describe("admin preferences (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores the last course and lesson for a user", () => {
    const store = createDefaultStore();
    const userId = "user_admin_1";

    writeAdminPreferences(userId, {
      tab: "assignment",
      courseId: store.courses[1]?.id ?? store.courses[0].id,
      lessonId:
        store.courses[1]?.lessons[0]?.id ?? store.courses[0].lessons[0].id,
    });

    const resolved = resolveAdminWorkspace(
      store,
      readAdminPreferences(userId),
    );

    expect(resolved.tab).toBe("assignment");
    expect(resolved.courseId).toBe(store.courses[1]?.id ?? store.courses[0].id);
  });

  it("falls back when a stored course was deleted", () => {
    const store = createDefaultStore();
    const resolved = resolveAdminWorkspace(store, {
      courseId: "missing-course",
      lessonId: "missing-lesson",
    });

    expect(resolved.courseId).toBe(store.courses[0].id);
    expect(resolved.lessonId).toBe(store.courses[0].lessons[0]?.id ?? "");
  });

  it("remembers lesson per course when switching courses", () => {
    const store = createDefaultStore();
    const courseA = store.courses[0].id;
    const courseB = store.courses[1]?.id;
    if (!courseB) return;

    const prefs = selectionAfterLessonChange(
      { courseId: courseA, lessonId: store.courses[0].lessons[1]?.id ?? "" },
      courseA,
      store.courses[0].lessons[1]?.id ?? store.courses[0].lessons[0].id,
    );

    const switched = selectionAfterCourseChange(store, prefs, courseB);
    expect(switched.courseId).toBe(courseB);

    const backToA = selectionAfterCourseChange(store, {
      ...prefs,
      courseId: courseB,
      lessonId: switched.lessonId,
      lessonByCourse: switched.lessonByCourse,
    }, courseA);

    expect(backToA.lessonId).toBe(prefs.lessonId);
  });
});
