import {
  digestToTemplateVariables,
  type ParentDailyDigest,
} from "@/lib/email/parent-daily-digest";

export function sampleParentDailyDigest(): ParentDailyDigest {
  return {
    parentName: "Alex",
    studentName: "Jordan",
    dateLabel: "Monday, July 7, 2026",
    lessons: [
      {
        courseId: "biology-year-1",
        lessonId: "lesson-1",
        chapter: 1,
        section: 2,
        lessonTitle: "Cell structure",
        sectionCorrect: 8,
        sectionAttempted: 12,
        reviewCorrect: 4,
        reviewAttempted: 4,
        parentEngagementPrompt:
          "Ask your student to explain the difference between plant and animal cells using examples from today's lesson.",
        freeResponseRubric:
          "10: Complete answer with accurate vocabulary and an example.\n7: Mostly correct with minor gaps.\n4: Partial understanding shown.\n0: Missing or incorrect.",
      },
    ],
    flashcardCorrect: 5,
    flashcardAttempted: 8,
    pendingFreeResponses: [
      {
        submissionId: "sample-submission",
        courseId: "biology-year-1",
        lessonId: "lesson-1",
        prompt: "Describe how mitochondria support cell function.",
        answerText:
          "Mitochondria make ATP through cellular respiration, which gives the cell energy for its work.",
        maxPoints: 10,
        rubricText:
          "10: Complete answer with accurate vocabulary and an example.\n7: Mostly correct with minor gaps.",
        gradeUrl: "https://example.com/parent/progress?submissionId=sample",
      },
    ],
    newFlashcards: [
      {
        courseId: "biology-year-1",
        lessonId: "lesson-1",
        front: "Mitochondria",
        studentBack: "The powerhouse of the cell; makes ATP.",
      },
    ],
  };
}

export function sampleDigestForPreview() {
  const digest = sampleParentDailyDigest();
  return {
    digest,
    variables: digestToTemplateVariables(digest),
  };
}
