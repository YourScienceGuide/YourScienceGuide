import type { CurriculumLesson, LessonAccessTier } from "@/lib/student/curriculum-types";

export const LEGACY_PREVIEW_LESSON_IDS = [
  "scientific-method",
  "lab-safety",
] as const;

export function defaultLessonAccessTier(lessonId: string): LessonAccessTier {
  return (LEGACY_PREVIEW_LESSON_IDS as readonly string[]).includes(lessonId)
    ? "preview"
    : "subscriber";
}

export function normalizeLessonAccessTier(
  tier: LessonAccessTier | null | undefined,
  lessonId: string,
): LessonAccessTier {
  if (tier === "preview" || tier === "subscriber") {
    return tier;
  }
  return defaultLessonAccessTier(lessonId);
}

export function getLessonAccessTier(
  lesson: Pick<CurriculumLesson, "id" | "accessTier"> | null | undefined,
): LessonAccessTier {
  if (!lesson) return "subscriber";
  return normalizeLessonAccessTier(lesson.accessTier, lesson.id);
}

export function isPreviewLesson(
  lesson: Pick<CurriculumLesson, "id" | "accessTier"> | null | undefined,
): boolean {
  return getLessonAccessTier(lesson) === "preview";
}

export function isSubscriberLesson(
  lesson: Pick<CurriculumLesson, "id" | "accessTier"> | null | undefined,
): boolean {
  return getLessonAccessTier(lesson) === "subscriber";
}

export function canGuestAccessLesson(
  lesson: Pick<CurriculumLesson, "id" | "accessTier"> | null | undefined,
): boolean {
  return isPreviewLesson(lesson);
}
