import { describe, expect, it } from "vitest";

import { buildReviewImportPreview, REVIEW_QUESTION_CSV_HEADERS } from "@/lib/admin/csv-review-questions";
import { makeCourse, makeMultipleChoice } from "../../helpers/factories";

describe("csv review questions", () => {
  const course = makeCourse();
  const fallbackLessonId = "lesson-a";

  it("excludes the Level column from template headers", () => {
    expect(REVIEW_QUESTION_CSV_HEADERS).not.toContain("Level");
    expect(REVIEW_QUESTION_CSV_HEADERS.length).toBeGreaterThan(0);
  });

  it("imports review questions without difficulty", () => {
    const csv = [
      REVIEW_QUESTION_CSV_HEADERS.join(","),
      '1,1,multiple-choice,"What is H2O?",Water,Air,,,1,,,Think chemistry',
    ].join("\n");

    const preview = buildReviewImportPreview(csv, course, fallbackLessonId);
    expect(preview.importableCount).toBe(1);
    expect(preview.errors).toHaveLength(0);
    const questions = Object.values(preview.reviewQuestionsByLessonKey)[0];
    expect(questions[0].type).toBe("multiple-choice");
    expect(questions[0]).not.toHaveProperty("difficulty");
  });

  it("skips review questions that already exist in the bank", () => {
    const lessonKey = "test-course/lesson-a";
    const csv = [
      REVIEW_QUESTION_CSV_HEADERS.join(","),
      '1,1,multiple-choice,"What is H2O?",Water,Air,,,1,,,Think chemistry',
    ].join("\n");
    const existing = {
      [lessonKey]: [
        makeMultipleChoice({
          id: "stored-review",
          prompt: "What is H2O?",
          options: ["Water", "Air"],
          correctIndex: 0,
          hint: "Think chemistry",
        }),
      ],
    };

    const preview = buildReviewImportPreview(csv, course, fallbackLessonId, existing);
    expect(preview.importableCount).toBe(0);
    expect(preview.skippedDuplicateCount).toBe(1);
    expect(Object.keys(preview.reviewQuestionsByLessonKey)).toHaveLength(0);
  });
});
