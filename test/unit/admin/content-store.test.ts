import { describe, expect, it } from "vitest";

import {
  assignmentQuestionDeletePhrase,
  assignmentQuestionsDeleteAllPhrase,
  courseDeleteConfirmationPhrase,
  createDefaultStore,
  getTextbookFromStore,
  lessonDeleteConfirmationPhrase,
  removeCourseFromStore,
  removeLessonFromStore,
  removeTextbookFromStore,
  sanitizeContentStore,
  setTextbookInStore,
} from "@/lib/admin/content-store";
import { lessonKey } from "@/lib/admin/lesson-key";
import { makeStore } from "../../helpers/factories";

describe("content store", () => {
  it("creates default store with seed courses and textbooks", () => {
    const store = createDefaultStore();
    expect(store.courses.length).toBeGreaterThan(0);
    expect(store.textbooks?.["biology-year-1"]).toBeDefined();
    expect(store.version).toBe(2);
  });

  it("migrates legacy unit fields to chapters", () => {
    const legacy = sanitizeContentStore({
      version: 1,
      courses: [
        {
          id: "legacy",
          title: "Legacy",
          subject: "Science",
          description: "Old",
          lessons: [
            {
              id: "l1",
              unitId: "unit-2",
              unitTitle: "Unit 2 · Cells",
              title: "Cells",
              description: "Desc",
              order: 1,
            } as never,
          ],
        },
      ],
      lessonQuestions: {},
      alcumusByLesson: {},
      videos: {},
    });

    const lesson = legacy.courses[0].lessons[0];
    expect(lesson.chapterId).toBe("chapter-2");
    expect(lesson.chapterTitle).toContain("Chapter");
  });

  it("manages textbooks per course", () => {
    const store = makeStore();
    const updated = setTextbookInStore(store, "biology-year-1", {
      title: "New Book",
      subtitle: "Vol 1",
      authors: "Author",
      edition: "1st",
      publisher: "Pub",
      coverSrc: "/cover.svg",
      coverAlt: "Cover",
    });
    expect(getTextbookFromStore(updated, "biology-year-1")?.title).toBe("New Book");

    const removed = removeTextbookFromStore(updated, "biology-year-1");
    expect(getTextbookFromStore(removed, "biology-year-1")).toBeUndefined();
  });

  it("removes lesson and course scoped data", () => {
    const courseId = "biology-year-1";
    const lessonId = "scientific-method";
    const key = lessonKey(courseId, lessonId);
    const store = makeStore({
      lessonQuestions: { [key]: [] },
      alcumusByLesson: { [key]: [] },
      videos: { [key]: { title: "V", description: "" } },
    });

    const afterLesson = removeLessonFromStore(store, courseId, lessonId);
    expect(afterLesson.lessonQuestions[key]).toBeUndefined();
    expect(afterLesson.courses[0].lessons.some((l) => l.id === lessonId)).toBe(
      false,
    );

    const afterCourse = removeCourseFromStore(store, courseId);
    expect(afterCourse.courses.some((c) => c.id === courseId)).toBe(false);
    expect(afterCourse.textbooks?.[courseId]).toBeUndefined();
  });

  it("builds admin delete confirmation phrases", () => {
    expect(courseDeleteConfirmationPhrase("Biology")).toBe("delete course Biology");
    expect(lessonDeleteConfirmationPhrase("Cells")).toBe("delete lesson Cells");
    expect(assignmentQuestionsDeleteAllPhrase("Cells")).toContain("assignment");
    expect(assignmentQuestionDeletePhrase(2)).toBe("delete assignment question 2");
  });
});
