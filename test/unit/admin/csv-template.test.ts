import { describe, expect, it } from "vitest";

import {
  buildQuestionTemplateCsv,
  questionTemplateFilename,
} from "@/lib/admin/csv-template";
import {
  CHAPTER_QUESTION_CSV_HEADERS,
  getCsvHeaders,
} from "@/lib/admin/csv-questions";
import { FLASHCARD_CSV_HEADERS } from "@/lib/admin/csv-flashcards";
import { REVIEW_QUESTION_CSV_HEADERS } from "@/lib/admin/csv-review-questions";

describe("csv template", () => {
  it("uses .csv filenames for every import kind", () => {
    const kinds = [
      "chapter",
      "alcumus",
      "end-of-chapter",
      "flashcards",
      "review",
    ] as const;

    for (const kind of kinds) {
      expect(questionTemplateFilename(kind)).toMatch(/\.csv$/);
    }
  });

  it("builds chapter templates with the expected headers", () => {
    const csv = buildQuestionTemplateCsv("chapter");
    expect(csv.trim()).toBe(CHAPTER_QUESTION_CSV_HEADERS.join(","));
  });

  it("builds flashcard templates with flashcard headers", () => {
    const csv = buildQuestionTemplateCsv("flashcards");
    expect(csv.trim()).toBe(FLASHCARD_CSV_HEADERS.join(","));
  });

  it("builds review templates without the Level column", () => {
    const csv = buildQuestionTemplateCsv("review");
    expect(csv.trim()).toBe(REVIEW_QUESTION_CSV_HEADERS.join(","));
    expect(csv).not.toContain("Level");
  });

  it("builds legacy alcumus templates with the shared question headers", () => {
    const csv = buildQuestionTemplateCsv("alcumus");
    expect(csv.trim()).toBe(getCsvHeaders("alcumus").join(","));
  });
});
