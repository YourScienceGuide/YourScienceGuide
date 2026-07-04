import { LEGACY_PREVIEW_LESSON_IDS } from "@/lib/student/lesson-access";

/** Legacy fallback preview ids used when old lesson records have no access tier yet. */
export const GUEST_PREVIEW_LESSON_IDS = LEGACY_PREVIEW_LESSON_IDS;

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
