import { lessonKey } from "@/lib/admin/lesson-key";
import { filterNewLessonQuestionsByLesson } from "@/lib/admin/csv-import-dedupe";
import {
  buildImportPreview,
  CHAPTER_QUESTION_CSV_HEADERS,
  type CsvRowError,
  type ParsedCsvRow,
} from "@/lib/admin/csv-questions";
import { stripChapterDifficulty } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import type { Course } from "@/lib/student/curriculum-types";

export const REVIEW_QUESTION_CSV_HEADERS = CHAPTER_QUESTION_CSV_HEADERS.filter(
  (header) => header !== "Level",
);

export type ReviewCsvImportPreview = {
  rows: ParsedCsvRow[];
  errors: CsvRowError[];
  reviewQuestionsByLessonKey: Record<string, LessonQuestion[]>;
  importableCount: number;
  skippedDuplicateCount: number;
};

export function buildReviewImportPreview(
  csvText: string,
  course: Course,
  fallbackLessonId: string,
  existingReviewQuestionsByLesson: Record<string, LessonQuestion[]> = {},
): ReviewCsvImportPreview {
  const preview = buildImportPreview(csvText, "chapter", course, fallbackLessonId);
  const rawReviewQuestionsByLessonKey: Record<string, LessonQuestion[]> = {};

  for (const [key, questions] of Object.entries(preview.questionBankByLessonKey)) {
    rawReviewQuestionsByLessonKey[key] = questions.map(stripChapterDifficulty);
  }

  const {
    filteredByLesson: reviewQuestionsByLessonKey,
    importableCount,
    skippedDuplicateCount,
  } = filterNewLessonQuestionsByLesson(
    existingReviewQuestionsByLesson,
    rawReviewQuestionsByLessonKey,
  );

  return {
    rows: preview.rows,
    errors: preview.errors,
    reviewQuestionsByLessonKey,
    importableCount,
    skippedDuplicateCount,
  };
}

export function buildReviewTemplateCsv(): string {
  return `${REVIEW_QUESTION_CSV_HEADERS.join(",")}\n`;
}

export function downloadReviewCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
