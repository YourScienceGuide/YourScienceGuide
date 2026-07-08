import { describe, expect, it } from "vitest";

import { INITIAL_LESSON_STATE } from "@/lib/lesson/state-machine";
import { INITIAL_GRADED_LESSON_PROGRESS } from "@/lib/lesson/graded-lesson-machine";
import { DEFAULT_GRADING_RUBRIC } from "@/lib/lesson/lesson-grade-config";
import {
  getLessonPartialPercent,
  getLessonStatus,
  getLessonStatusForLesson,
  lessonProgressPercent,
  loadLessonProgress,
  saveLessonProgress,
  storedToMachineState,
} from "@/lib/student/lesson-progress";
import {
  saveGradedLessonProgress,
} from "@/lib/student/graded-lesson-progress";
import { GUEST_STUDENT_SCOPE } from "@/lib/student/student-scope";

describe("lesson progress (localStorage)", () => {
  const courseId = "biology-year-1";
  const lessonId = "scientific-method";
  const studentA = "student-a";
  const studentB = "student-b";

  it("persists and loads progress per student", () => {
    expect(loadLessonProgress(studentA, courseId, lessonId)).toBeNull();

    saveLessonProgress(studentA, courseId, lessonId, {
      ...INITIAL_LESSON_STATE,
      completedCount: 1,
      questionIndex: 1,
    });

    expect(loadLessonProgress(studentA, courseId, lessonId)?.completedCount).toBe(1);
    expect(loadLessonProgress(studentB, courseId, lessonId)).toBeNull();
  });

  it("does not persist guest progress", () => {
    saveLessonProgress(studentA, courseId, lessonId, {
      ...INITIAL_LESSON_STATE,
      completedCount: 1,
      questionIndex: 1,
    });
    saveLessonProgress(GUEST_STUDENT_SCOPE, courseId, lessonId, {
      ...INITIAL_LESSON_STATE,
      completedCount: 2,
      questionIndex: 2,
      isComplete: false,
    });

    expect(loadLessonProgress(GUEST_STUDENT_SCOPE, courseId, lessonId)).toBeNull();
    expect(loadLessonProgress(studentA, courseId, lessonId)?.completedCount).toBe(1);
  });

  it("derives lesson status from stored state", () => {
    expect(getLessonStatus(null)).toBe("not_started");
    expect(
      getLessonStatus({ questionIndex: 0, completedCount: 0, isComplete: false }),
    ).toBe("not_started");
    expect(
      getLessonStatus({ questionIndex: 1, completedCount: 1, isComplete: false }),
    ).toBe("in_progress");
    expect(
      getLessonStatus({ questionIndex: 2, completedCount: 3, isComplete: true }),
    ).toBe("complete");
  });

  it("restores machine state partial fields", () => {
    const restored = storedToMachineState({
      questionIndex: 2,
      completedCount: 2,
      isComplete: false,
    });
    expect(restored?.questionIndex).toBe(2);
    expect(restored?.difficulty).toBe(1);
  });

  it("computes percent from stored progress", () => {
    expect(lessonProgressPercent(null)).toBe(0);
    expect(
      lessonProgressPercent(
        { questionIndex: 1, completedCount: 1, isComplete: false },
        3,
      ),
    ).toBe(33);
    expect(
      lessonProgressPercent({ questionIndex: 2, completedCount: 3, isComplete: true }, 3),
    ).toBe(100);
  });

  it("uses graded lesson progress for course status", () => {
    saveGradedLessonProgress(studentA, courseId, lessonId, {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      reviewCorrectIds: ["warmup-1"],
    });

    expect(getLessonStatusForLesson(studentA, courseId, lessonId)).toBe("in_progress");
    expect(getLessonStatusForLesson(studentB, courseId, lessonId)).toBe("not_started");
  });

  it("uses graded lesson completion for partial percent, not grade percent", () => {
    saveGradedLessonProgress(studentA, courseId, lessonId, {
      ...INITIAL_GRADED_LESSON_PROGRESS,
      phase: "multiple-choice",
      mcIndex: 4,
      mcCorrectIds: [],
      mcCorrectCount: 0,
    });

    const partial = getLessonPartialPercent(
      studentA,
      courseId,
      lessonId,
      DEFAULT_GRADING_RUBRIC,
    );

    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(100);
  });
});
