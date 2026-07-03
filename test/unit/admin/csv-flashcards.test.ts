import { describe, expect, it } from "vitest";

import { parseFlashcardCsv } from "@/lib/admin/csv-flashcards";
import { SEED_COURSES } from "@/lib/student/curriculum-seed";

describe("csv flashcards", () => {
  const course = SEED_COURSES[0];
  const fallbackLessonId = course.lessons[0].id;

  it("parses term rows and maps them to lessons", () => {
    const csv = `Chapter,Section,Term\n3,1,Mitochondria\n3,2,Ribosome\n`;
    const preview = parseFlashcardCsv(csv, course, fallbackLessonId);

    expect(preview.importableCount).toBe(2);
    expect(preview.errors).toHaveLength(0);
    expect(Object.keys(preview.flashcardsByLessonKey).length).toBeGreaterThan(0);
  });

  it("reports missing terms", () => {
    const csv = `Chapter,Section,Term\n3,1,\n`;
    const preview = parseFlashcardCsv(csv, course, fallbackLessonId);
    expect(preview.importableCount).toBe(0);
    expect(preview.errors[0].message).toContain("Term is required");
  });
});
