import { getLessonTier } from "@/lib/guest/lesson-tiers";

export const GUEST_LESSON_LIMIT = 2;
const STORAGE_KEY = "ysg-guest-completed-lessons";

export function guestLessonKey(courseId: string, lessonId: string) {
  return `${courseId}:${lessonId}`;
}

function readCompleted(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCompleted(keys: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getGuestCompletedLessons(): string[] {
  return readCompleted();
}

export function getGuestCompletedCount(): number {
  return readCompleted().length;
}

export function hasGuestCompletedLesson(
  courseId: string,
  lessonId: string,
): boolean {
  return readCompleted().includes(guestLessonKey(courseId, lessonId));
}

export function canGuestOpenLesson(courseId: string, lessonId: string): boolean {
  if (getLessonTier(lessonId) === "advanced") return false;

  const key = guestLessonKey(courseId, lessonId);
  const completed = readCompleted();
  if (completed.includes(key)) return true;
  return completed.length < GUEST_LESSON_LIMIT;
}

/** Returns the new completion count after recording (idempotent). */
export function recordGuestLessonComplete(
  courseId: string,
  lessonId: string,
): number {
  const key = guestLessonKey(courseId, lessonId);
  const completed = readCompleted();
  if (completed.includes(key)) return completed.length;
  const next = [...completed, key];
  writeCompleted(next);
  return next.length;
}
