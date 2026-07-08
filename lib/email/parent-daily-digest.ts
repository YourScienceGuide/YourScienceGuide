import type { GradedLessonProgress } from "@/lib/lesson/graded-lesson-machine";
import { renderGradeButtonHtml } from "@/lib/email/render-template";

export type LessonDigestActivity = {
  courseId: string;
  lessonId: string;
  chapter: number;
  section: number;
  lessonTitle: string;
  sectionCorrect: number;
  sectionAttempted: number;
  reviewCorrect: number;
  reviewAttempted: number;
  parentEngagementPrompt: string;
  freeResponseRubric: string;
};

export type PendingFreeResponse = {
  submissionId: string;
  courseId: string;
  lessonId: string;
  prompt: string;
  answerText: string;
  maxPoints: number;
  rubricText: string;
  gradeUrl: string;
};

export type NewFlashcardDefinition = {
  front: string;
  studentBack: string;
  courseId: string;
  lessonId: string;
};

export type ParentDailyDigest = {
  parentName: string;
  studentName: string;
  dateLabel: string;
  lessons: LessonDigestActivity[];
  flashcardCorrect: number;
  flashcardAttempted: number;
  pendingFreeResponses: PendingFreeResponse[];
  newFlashcards: NewFlashcardDefinition[];
};

export function buildLessonActivitySummary(lessons: LessonDigestActivity[]): string {
  if (lessons.length === 0) {
    return "No lesson problems recorded today.";
  }

  return lessons
    .map((lesson) => {
      const chapter = lesson.chapter > 0 ? lesson.chapter : "?";
      const section = lesson.section > 0 ? lesson.section : "?";
      return [
        `Chapter ${chapter} Section ${section} problems: ${lesson.sectionCorrect} out of ${lesson.sectionAttempted}`,
        `Review problems: ${lesson.reviewCorrect} out of ${lesson.reviewAttempted}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildFlashcardSummary(correct: number, attempted: number): string {
  if (attempted === 0) return "";
  return `Flashcards studied: ${correct} out of ${attempted}`;
}

export function buildFreeResponseSection(
  submissions: PendingFreeResponse[],
  options?: { html?: boolean },
): string {
  if (submissions.length === 0) return "";

  return submissions
    .map((submission) => {
      const lines = [
        `Free response prompt: ${submission.prompt}`,
        `Student response: ${submission.answerText}`,
        "",
        `Grading rubric (out of ${submission.maxPoints}): ${submission.rubricText}`,
      ];
      if (options?.html && submission.gradeUrl) {
        lines.push("", renderGradeButtonHtml(submission.gradeUrl));
      } else if (submission.gradeUrl) {
        lines.push("", `Grade this response: ${submission.gradeUrl}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function buildNewFlashcardsSection(flashcards: NewFlashcardDefinition[]): string {
  if (flashcards.length === 0) return "";

  const lines = ["New flashcards:", ...flashcards.map((card) => `${card.front} / ${card.studentBack}`)];
  return lines.join("\n");
}

export function buildParentEngagementPrompt(lessons: LessonDigestActivity[]): string {
  const prompts = [
    ...new Set(
      lessons
        .map((lesson) => lesson.parentEngagementPrompt.trim())
        .filter((prompt) => prompt.length > 0),
    ),
  ];
  return prompts.join("\n\n");
}

export function digestToTemplateVariables(
  digest: ParentDailyDigest,
): Record<string, string> {
  const gradeUrl = digest.pendingFreeResponses[0]?.gradeUrl ?? "";
  return {
    parentName: digest.parentName,
    studentName: digest.studentName,
    date: digest.dateLabel,
    lessonActivitySummary: buildLessonActivitySummary(digest.lessons),
    flashcardSummary: buildFlashcardSummary(
      digest.flashcardCorrect,
      digest.flashcardAttempted,
    ),
    freeResponseSection: buildFreeResponseSection(digest.pendingFreeResponses),
    newFlashcardsSection: buildNewFlashcardsSection(digest.newFlashcards),
    parentEngagementPrompt: buildParentEngagementPrompt(digest.lessons),
    gradeUrl,
  };
}

export function sectionCountsFromPhaseProgress(
  progress: GradedLessonProgress | null | undefined,
): {
  sectionCorrect: number;
  sectionAttempted: number;
  reviewCorrect: number;
  reviewAttempted: number;
} {
  if (!progress) {
    return {
      sectionCorrect: 0,
      sectionAttempted: 0,
      reviewCorrect: 0,
      reviewAttempted: 0,
    };
  }

  const sectionCorrect =
    progress.mcCorrectIds.length +
    progress.fibCorrectIds.length +
    progress.extraCorrectIds.length;
  const sectionAttempted = Math.max(
    progress.mcIndex,
    progress.fibIndex,
    progress.extraIndex,
    sectionCorrect,
  );
  const reviewCorrect = progress.reviewCorrectIds.length;
  const reviewAttempted = Math.max(
    reviewCorrect + progress.reviewHeldIds.length,
    reviewCorrect,
  );

  return { sectionCorrect, sectionAttempted, reviewCorrect, reviewAttempted };
}

export function sentOnDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
