import { describe, expect, it } from "vitest";

import {
  buildFlashcardSummary,
  buildFreeResponseSection,
  buildLessonActivitySummary,
  buildNewFlashcardsSection,
  buildParentEngagementPrompt,
  digestToTemplateVariables,
  sectionCountsFromPhaseProgress,
  sentOnDateString,
} from "@/lib/email/parent-daily-digest";
import { DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE } from "@/lib/email/default-parent-daily-template";
import {
  plainTextToHtml,
  renderEmailTemplate,
  renderGradeButtonHtml,
} from "@/lib/email/render-template";
import { sampleDigestForPreview } from "@/lib/email/sample-parent-daily-digest";
import { INITIAL_GRADED_LESSON_PROGRESS } from "@/lib/lesson/graded-lesson-machine";

describe("renderEmailTemplate", () => {
  it("replaces known variables and leaves unknown placeholders empty", () => {
    const rendered = renderEmailTemplate(
      "Hello {{parentName}}, {{unknown}}",
      { parentName: "Alex" },
    );
    expect(rendered).toBe("Hello Alex, ");
  });

  it("replaces repeated placeholders", () => {
    const rendered = renderEmailTemplate("{{name}} and {{name}}", { name: "Sam" });
    expect(rendered).toBe("Sam and Sam");
  });
});

describe("renderGradeButtonHtml", () => {
  it("returns empty string when url is missing", () => {
    expect(renderGradeButtonHtml("")).toBe("");
  });

  it("escapes html in the grade link", () => {
    const html = renderGradeButtonHtml(
      'https://example.com/parent/progress?x="1"',
      "Submit <grade>",
    );
    expect(html).toContain("href=");
    expect(html).not.toContain('href="https://example.com/parent/progress?x="1""');
    expect(html).toContain("Submit &lt;grade&gt;");
  });
});

describe("plainTextToHtml", () => {
  it("escapes html and preserves line breaks", () => {
    const html = plainTextToHtml("Line 1\n<script>");
    expect(html).toContain("Line 1<br />");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("parent daily digest formatting", () => {
  const sampleDigest = {
    parentName: "Alex",
    studentName: "Jordan",
    dateLabel: "Monday, July 7, 2026",
    lessons: [
      {
        courseId: "biology",
        lessonId: "lesson-1",
        chapter: 1,
        section: 2,
        lessonTitle: "Cells",
        sectionCorrect: 8,
        sectionAttempted: 12,
        reviewCorrect: 4,
        reviewAttempted: 4,
        parentEngagementPrompt: "Discuss plant vs animal cells.",
        freeResponseRubric: "10 = complete",
      },
      {
        courseId: "biology",
        lessonId: "lesson-2",
        chapter: 0,
        section: 0,
        lessonTitle: "Untitled",
        sectionCorrect: 2,
        sectionAttempted: 3,
        reviewCorrect: 1,
        reviewAttempted: 2,
        parentEngagementPrompt: "Discuss plant vs animal cells.",
        freeResponseRubric: "",
      },
    ],
    flashcardCorrect: 5,
    flashcardAttempted: 8,
    pendingFreeResponses: [
      {
        submissionId: "sub-1",
        courseId: "biology",
        lessonId: "lesson-1",
        prompt: "Explain mitochondria.",
        answerText: "They make ATP.",
        maxPoints: 10,
        rubricText: "10 = complete",
        gradeUrl: "https://example.com/grade",
      },
    ],
    newFlashcards: [
      {
        courseId: "biology",
        lessonId: "lesson-1",
        front: "Mitochondria",
        studentBack: "Powerhouse of the cell",
      },
    ],
  };

  it("builds lesson activity lines", () => {
    expect(buildLessonActivitySummary(sampleDigest.lessons)).toContain(
      "Chapter 1 Section 2 problems: 8 out of 12",
    );
    expect(buildLessonActivitySummary(sampleDigest.lessons)).toContain(
      "Review problems: 4 out of 4",
    );
    expect(buildLessonActivitySummary(sampleDigest.lessons)).toContain(
      "Chapter ? Section ? problems: 2 out of 3",
    );
  });

  it("handles empty lesson activity", () => {
    expect(buildLessonActivitySummary([])).toBe("No lesson problems recorded today.");
  });

  it("builds flashcard, free response, and new flashcard sections", () => {
    expect(buildFlashcardSummary(5, 8)).toBe("Flashcards studied: 5 out of 8");
    expect(buildFlashcardSummary(0, 0)).toBe("");
    expect(buildFreeResponseSection(sampleDigest.pendingFreeResponses)).toContain(
      "Explain mitochondria.",
    );
    expect(buildFreeResponseSection(sampleDigest.pendingFreeResponses)).toContain(
      "Grade this response: https://example.com/grade",
    );
    expect(
      buildFreeResponseSection(sampleDigest.pendingFreeResponses, { html: true }),
    ).toContain("Submit grade");
    expect(buildNewFlashcardsSection(sampleDigest.newFlashcards)).toContain(
      "Mitochondria / Powerhouse of the cell",
    );
    expect(buildNewFlashcardsSection([])).toBe("");
    expect(buildFreeResponseSection([])).toBe("");
  });

  it("deduplicates parent engagement prompts across lessons", () => {
    expect(buildParentEngagementPrompt(sampleDigest.lessons)).toBe(
      "Discuss plant vs animal cells.",
    );
    expect(buildParentEngagementPrompt([])).toBe("");
  });

  it("maps digest fields to template variables", () => {
    const variables = digestToTemplateVariables(sampleDigest);
    expect(variables.parentName).toBe("Alex");
    expect(variables.studentName).toBe("Jordan");
    expect(variables.date).toBe("Monday, July 7, 2026");
    expect(variables.gradeUrl).toBe("https://example.com/grade");
    expect(variables.flashcardSummary).toContain("5 out of 8");
  });

  it("renders the default admin template with digest variables", () => {
    const variables = digestToTemplateVariables(sampleDigest);
    const rendered = renderEmailTemplate(
      DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE.body,
      variables,
    );
    expect(rendered).toContain("Dear Alex,");
    expect(rendered).toContain("Today, Jordan completed:");
    expect(rendered).toContain("Discuss plant vs animal cells.");
  });

  it("renders the default subject with student name", () => {
    const variables = digestToTemplateVariables(sampleDigest);
    const subject = renderEmailTemplate(
      DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE.subject,
      variables,
    );
    expect(subject).toBe("Daily progress for Jordan");
  });
});

describe("sectionCountsFromPhaseProgress", () => {
  it("returns zeros when progress is missing", () => {
    expect(sectionCountsFromPhaseProgress(null)).toEqual({
      sectionCorrect: 0,
      sectionAttempted: 0,
      reviewCorrect: 0,
      reviewAttempted: 0,
    });
  });

  it("counts section and review progress from phase state", () => {
    const counts = sectionCountsFromPhaseProgress({
      ...INITIAL_GRADED_LESSON_PROGRESS,
      mcCorrectIds: ["mc-1", "mc-2"],
      fibCorrectIds: ["fib-1"],
      extraCorrectIds: [],
      mcIndex: 5,
      fibIndex: 2,
      extraIndex: 0,
      reviewCorrectIds: ["r-1", "r-2"],
      reviewHeldIds: ["r-3"],
    });

    expect(counts.sectionCorrect).toBe(3);
    expect(counts.sectionAttempted).toBe(5);
    expect(counts.reviewCorrect).toBe(2);
    expect(counts.reviewAttempted).toBe(3);
  });
});

describe("sentOnDateString", () => {
  it("formats dates as YYYY-MM-DD in UTC", () => {
    expect(sentOnDateString(new Date("2026-07-08T04:30:00.000Z"))).toBe("2026-07-08");
  });
});

describe("sampleDigestForPreview", () => {
  it("provides non-empty preview variables for the admin UI", () => {
    const { variables } = sampleDigestForPreview();
    expect(variables.parentName).toBe("Alex");
    expect(variables.lessonActivitySummary).toContain("Chapter 1 Section 2");
    expect(variables.freeResponseSection).toContain("mitochondria");
    expect(variables.newFlashcardsSection).toContain("Mitochondria");
  });
});
