import { describe, expect, it } from "vitest";

import {
  getAdjacentLessons,
  getCourse,
  getLesson,
  getLessonsByChapter,
  SEED_COURSES,
} from "@/lib/student/curriculum";

describe("curriculum seed helpers", () => {
  it("finds biology course and lessons", () => {
    const course = getCourse("biology-year-1");
    expect(course).toBeDefined();
    expect(course?.lessons.length).toBeGreaterThan(0);

    const lesson = getLesson("biology-year-1", "scientific-method");
    expect(lesson?.title).toContain("scientific");
  });

  it("groups lessons by chapter", () => {
    const course = SEED_COURSES[0];
    const chapters = getLessonsByChapter(course);
    expect(chapters.length).toBeGreaterThan(1);
    expect(chapters[0].lessons.length).toBeGreaterThan(0);
  });

  it("returns adjacent lessons", () => {
    const { prev, next } = getAdjacentLessons(
      "biology-year-1",
      "cells-introduction",
    );
    expect(prev?.id).toBe("lab-safety");
    expect(next?.id).toBe("cell-membrane");
  });

  it("returns undefined for unknown ids", () => {
    expect(getCourse("missing")).toBeUndefined();
    expect(getAdjacentLessons("biology-year-1", "missing")).toEqual({
      prev: undefined,
      next: undefined,
    });
  });
});
