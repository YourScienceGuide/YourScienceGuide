import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import { canGuestAccessLesson } from "@/lib/student/lesson-access";

export function canGuestOpenLesson(
  lesson: Pick<CurriculumLesson, "id" | "accessTier"> | null | undefined,
): boolean {
  return canGuestAccessLesson(lesson);
}
