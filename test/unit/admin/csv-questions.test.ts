import { describe, expect, it } from "vitest";

import {
  buildImportPreview,
  buildTemplateCsv,
  getCsvHeaders,
  kindLabel,
  parseCsv,
  parseQuestionCsv,
  serializeExampleRow,
} from "@/lib/admin/csv-questions";
import { makeChapterChoice, makeCourse } from "../../helpers/factories";

const CHAPTER_HEADERS =
  "Chapter,Section,Type,Question,Option 1,Option 2,Option 3,Option 4,Correct,Accepted Answers,Min Length,Hint,Level";

describe("parseCsv", () => {
  it("parses quoted fields and commas", () => {
    const rows = parseCsv('a,"b,c",d\n1,2,3');
    expect(rows).toEqual([
      ["a", "b,c", "d"],
      ["1", "2", "3"],
    ]);
  });

  it("handles escaped quotes", () => {
    const rows = parseCsv('"say ""hi""",ok');
    expect(rows[0][0]).toBe('say "hi"');
  });
});

describe("parseQuestionCsv", () => {
  it("rejects empty files", () => {
    const result = parseQuestionCsv("", "end-of-chapter");
    expect(result.errors[0].message).toContain("empty");
  });

  it("requires headers", () => {
    const result = parseQuestionCsv("bad,headers\n1,2", "end-of-chapter");
    expect(result.errors[0].message).toContain("Missing required column");
  });

  it("parses valid multiple-choice row with two options", () => {
    const csv = `${CHAPTER_HEADERS}
1,1,multiple-choice,True or false?,True,False,,,1,,,,1`;
    const { rows, errors } = parseQuestionCsv(csv, "end-of-chapter");
    expect(errors).toHaveLength(0);
    expect(rows[0].type).toBe("multiple-choice");
    expect(rows[0].options).toEqual(["True", "False"]);
    expect(rows[0].correct).toBe(1);
  });

  it("parses fill-in-the-blank for end-of-chapter only", () => {
    const csv = `${CHAPTER_HEADERS}
1,1,fill-in-the-blank,Water is ________.,,,,,,"H2O,h2o",,,1`;
    const chapter = parseQuestionCsv(csv, "end-of-chapter");
    expect(chapter.errors).toHaveLength(0);
    expect(chapter.rows[0].blankAnswers[0]).toContain("H2O");

    const alcumus = parseQuestionCsv(csv, "alcumus");
    expect(alcumus.errors[0].message).toContain("legacy Alcumus");
  });

  it("rejects skipped multiple-choice option columns", () => {
    const csv = `${CHAPTER_HEADERS}
1,1,multiple-choice,Pick one,A,,B,,1,,,,1`;
    const { errors } = parseQuestionCsv(csv, "end-of-chapter");
    expect(errors[0].message).toContain("filled in order");
  });

  it("requires blank markers in fill-in-the-blank prompts", () => {
    const csv = `${CHAPTER_HEADERS}
1,1,fill-in-the-blank,No blanks here.,,,,,,answer,,,1`;
    const { errors } = parseQuestionCsv(csv, "end-of-chapter");
    expect(errors[0].message).toContain("underscore");
  });
});

describe("buildImportPreview", () => {
  it("maps rows to lessons by chapter and section", () => {
    const course = makeCourse();
    const csv = `${CHAPTER_HEADERS}
1,1,multiple-choice,Question?,A,B,,,1,,,,2`;
    const preview = buildImportPreview(csv, "chapter", course, "lesson-a");
    expect(preview.importableCount).toBe(1);
    expect(preview.skippedDuplicateCount).toBe(0);
    expect(Object.keys(preview.questionBankByLessonKey)).toContain(
      "test-course/lesson-a",
    );
  });

  it("skips questions that already exist in the question bank", () => {
    const course = makeCourse();
    const lessonKey = "test-course/lesson-a";
    const csv = `${CHAPTER_HEADERS}
1,1,multiple-choice,Question?,A,B,,,1,,,,2
1,1,multiple-choice,Question?,A,B,,,1,,,,2`;
    const existing = {
      [lessonKey]: [
        makeChapterChoice({
          id: "stored-1",
          prompt: "Question?",
          options: ["A", "B"],
          correctIndex: 0,
          difficulty: 2,
        }),
      ],
    };

    const preview = buildImportPreview(csv, "chapter", course, "lesson-a", existing);
    expect(preview.importableCount).toBe(0);
    expect(preview.skippedDuplicateCount).toBe(2);
    expect(Object.keys(preview.questionBankByLessonKey)).toHaveLength(0);
  });
});

describe("csv utilities", () => {
  it("exposes headers and templates", () => {
    expect(getCsvHeaders("alcumus")).toContain("Level");
    expect(getCsvHeaders("end-of-chapter")).toContain("Min Length");
    expect(buildTemplateCsv("alcumus")).toContain("Chapter");
  });

  it("serializes example rows", () => {
    expect(serializeExampleRow("alcumus", "multiple-choice")).toContain(
      "multiple-choice",
    );
    expect(kindLabel("alcumus")).toBeTruthy();
  });
});
