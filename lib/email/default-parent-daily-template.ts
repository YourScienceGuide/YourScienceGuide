export type ParentDailyEmailTemplate = {
  subject: string;
  body: string;
  enabled: boolean;
};

export const PARENT_DAILY_EMAIL_TEMPLATE_ID = "default";

export const DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE: ParentDailyEmailTemplate = {
  subject: "Daily progress for {{studentName}}",
  body: `Dear {{parentName}},

Today, {{studentName}} completed:

{{lessonActivitySummary}}

{{flashcardSummary}}

{{freeResponseSection}}

{{newFlashcardsSection}}

Discussion prompt: {{parentEngagementPrompt}}`,
  enabled: true,
};

export const PARENT_DAILY_EMAIL_VARIABLES: ReadonlyArray<{
  key: string;
  description: string;
}> = [
  { key: "parentName", description: "Parent's first name or display name" },
  { key: "studentName", description: "Student display name" },
  { key: "date", description: "Today's date (locale formatted)" },
  {
    key: "lessonActivitySummary",
    description:
      "Per-lesson lines: chapter/section problems and review problems (right vs attempted)",
  },
  {
    key: "flashcardSummary",
    description: "Flashcards studied today (correct out of attempted)",
  },
  {
    key: "freeResponseSection",
    description:
      "Free response prompt, student answer, rubric, and grade button link (if pending)",
  },
  {
    key: "newFlashcardsSection",
    description: "New or updated flashcard definitions (front / student back)",
  },
  {
    key: "parentEngagementPrompt",
    description: "Discussion prompt from the lesson(s) worked on today",
  },
  { key: "gradeUrl", description: "Link for parents to grade a pending free response" },
];
