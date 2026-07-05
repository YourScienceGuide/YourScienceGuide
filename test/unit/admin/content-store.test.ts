import { describe, expect, it } from "vitest";

import {
  assignmentQuestionDeletePhrase,
  assignmentQuestionsDeleteAllPhrase,
  courseDeleteConfirmationPhrase,
  createDefaultStore,
  getFlashcardsFromStore,
  getQuestionBankFromStore,
  getReviewQuestionsFromStore,
  getTextbookFromStore,
  lessonDeleteConfirmationPhrase,
  removeCourseFromStore,
  removeLessonFromStore,
  removeTextbookFromStore,
  sanitizeContentStore,
  setTextbookInStore,
} from "@/lib/admin/content-store";
import {
  EMPTY_CHAPTER_QUESTIONS,
  EMPTY_FLASHCARDS,
  EMPTY_LESSON_QUESTIONS,
} from "@/lib/utils/collections";
import { lessonKey } from "@/lib/admin/lesson-key";
import { makeStore } from "../../helpers/factories";

describe("content store", () => {
  it("creates default store with seed courses and textbooks", () => {
    const store = createDefaultStore();
    expect(store.courses.length).toBeGreaterThan(0);
    expect(store.textbooks?.["biology-year-1"]).toBeDefined();
    expect(store.version).toBe(3);
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
      questionBank: {},
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
      questionBank: { [key]: [] },
      videos: { [key]: { title: "V", description: "" } },
    });

    const afterLesson = removeLessonFromStore(store, courseId, lessonId);
    expect(afterLesson.questionBank[key]).toBeUndefined();
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
    expect(assignmentQuestionsDeleteAllPhrase("Cells")).toContain("chapter");
    expect(assignmentQuestionDeletePhrase(2)).toBe("delete chapter question 2");
  });

  describe("stable empty getters", () => {
    const store = makeStore();
    const courseId = "missing-course";
    const lessonId = "missing-lesson";

    it("returns shared EMPTY_CHAPTER_QUESTIONS when question bank key is missing", () => {
      const first = getQuestionBankFromStore(store, courseId, lessonId);
      const second = getQuestionBankFromStore(store, courseId, lessonId);
      expect(first).toBe(EMPTY_CHAPTER_QUESTIONS);
      expect(second).toBe(first);
    });

    it("returns shared EMPTY_FLASHCARDS when flashcards key is missing", () => {
      const first = getFlashcardsFromStore(store, courseId, lessonId);
      const second = getFlashcardsFromStore(store, courseId, lessonId);
      expect(first).toBe(EMPTY_FLASHCARDS);
      expect(second).toBe(first);
    });

    it("returns shared EMPTY_LESSON_QUESTIONS when review questions key is missing", () => {
      const first = getReviewQuestionsFromStore(store, courseId, lessonId);
      const second = getReviewQuestionsFromStore(store, courseId, lessonId);
      expect(first).toBe(EMPTY_LESSON_QUESTIONS);
      expect(second).toBe(first);
    });
  });
});
