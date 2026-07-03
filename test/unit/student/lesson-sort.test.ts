import { describe, expect, it } from "vitest";

import { SEED_COURSES } from "@/lib/student/curriculum-seed";
import {
  compareLessons,
  findLessonWithChapterSection,
  lessonChapterNumber,
  lessonSectionNumber,
  sortLessons,
} from "@/lib/student/lesson-sort";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";

describe("lesson sort", () => {
  it("sorts by chapter then section", () => {
    const lessons: CurriculumLesson[] = [
      {
        id: "b",
        chapterId: "chapter-2",
        chapterTitle: "Ch 2",
        title: "B",
        description: "",
        order: 99,
        chapter: 2,
        section: 1,
      },
      {
        id: "a",
        chapterId: "chapter-1",
        chapterTitle: "Ch 1",
        title: "A",
        description: "",
        order: 99,
        chapter: 1,
        section: 2,
      },
      {
        id: "c",
        chapterId: "chapter-1",
        chapterTitle: "Ch 1",
        title: "C",
        description: "",
        order: 1,
        chapter: 1,
        section: 1,
      },
    ];

    expect(sortLessons(lessons).map((lesson) => lesson.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("uses section as tiebreaker within the same chapter", () => {
    expect(
      compareLessons(
        {
          id: "x",
          chapterId: "chapter-1",
          chapterTitle: "Ch 1",
          title: "X",
          description: "",
          order: 1,
          chapter: 1,
          section: 2,
        },
        {
          id: "y",
          chapterId: "chapter-1",
          chapterTitle: "Ch 1",
          title: "Y",
          description: "",
          order: 1,
          chapter: 1,
          section: 1,
        },
      ),
    ).toBeGreaterThan(0);
  });

  it("sorts seed lessons in curriculum order", () => {
    const sorted = sortLessons(SEED_COURSES[0].lessons);
    expect(sorted[0].id).toBe("scientific-method");
    expect(lessonChapterNumber(sorted.at(-1)!)).toBe(5);
    expect(lessonSectionNumber(sorted[0])).toBe(1);
  });

  it("finds a lesson with the same chapter and section", () => {
    const lessons: CurriculumLesson[] = [
      {
        id: "a",
        chapterId: "chapter-3",
        chapterTitle: "Ch 3",
        title: "A",
        description: "",
        order: 3005,
        chapter: 3,
        section: 5,
      },
      {
        id: "b",
        chapterId: "chapter-3",
        chapterTitle: "Ch 3",
        title: "B",
        description: "",
        order: 3001,
        chapter: 3,
        section: 1,
      },
    ];

    expect(findLessonWithChapterSection(lessons, 3, 5)?.id).toBe("a");
    expect(findLessonWithChapterSection(lessons, 3, 5, "a")).toBeUndefined();
    expect(findLessonWithChapterSection(lessons, 3, 1)?.id).toBe("b");
  });
});
