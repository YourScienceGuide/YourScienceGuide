/** First two curriculum lessons are free previews for guests. */
export const GUEST_PREVIEW_LESSON_IDS = [
  "scientific-method",
  "lab-safety",
] as const;

export type LessonTier = "preview" | "advanced";

export function getLessonTier(lessonId: string): LessonTier {
  return (GUEST_PREVIEW_LESSON_IDS as readonly string[]).includes(lessonId)
    ? "preview"
    : "advanced";
}

export function isPreviewLesson(lessonId: string) {
  return getLessonTier(lessonId) === "preview";
}

export function isAdvancedLesson(lessonId: string) {
  return getLessonTier(lessonId) === "advanced";
}
