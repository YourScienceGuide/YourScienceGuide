import type { AdminFlashcard } from "@/lib/lesson/admin-flashcard-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import type { TextbookReading } from "@/lib/student/textbook";

/** Shared empty arrays so getters and hooks do not allocate new [] each render. */
export const EMPTY_CHAPTER_QUESTIONS: ChapterQuestion[] = [];
export const EMPTY_LESSON_QUESTIONS: LessonQuestion[] = [];
export const EMPTY_FLASHCARDS: AdminFlashcard[] = [];
export const EMPTY_TEXTBOOK_READINGS: TextbookReading[] = [];

export function listIdSignature(
  items: ReadonlyArray<{ id: string }>,
): string {
  return items.map((item) => item.id).join(",");
}
