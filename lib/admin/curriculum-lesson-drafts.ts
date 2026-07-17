import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import {
  findLessonWithChapterSection,
  lessonChapterNumber,
  lessonSectionNumber,
  sortLessons,
  sortOrderForLesson,
} from "@/lib/student/lesson-sort";

export function nextLessonSlot(lessons: CurriculumLesson[]): {
  chapter: number;
  section: number;
  chapterTitle: string;
} {
  if (lessons.length === 0) {
    return { chapter: 1, section: 1, chapterTitle: "Chapter 1" };
  }

  const sorted = sortLessons(lessons);
  const last = sorted[sorted.length - 1];
  const chapter = lessonChapterNumber(last) || 1;
  const section = (lessonSectionNumber(last) || 0) + 1;
  const chapterTitle = last.chapterTitle?.trim() || `Chapter ${chapter}`;

  if (!findLessonWithChapterSection(lessons, chapter, section)) {
    return { chapter, section, chapterTitle };
  }

  return {
    chapter: chapter + 1,
    section: 1,
    chapterTitle: `Chapter ${chapter + 1}`,
  };
}

/**
 * Keep title/description edits when the saved lesson list gains/loses lessons.
 * Prevents "Add lesson" from looking like unsaved title edits, and prevents
 * Save changes from writing a stale draft list that drops the new lesson.
 */
export function syncLessonDraftsWithSaved(
  saved: CurriculumLesson[],
  drafts: CurriculumLesson[],
): CurriculumLesson[] {
  const draftById = new Map(drafts.map((lesson) => [lesson.id, lesson]));
  const savedIds = new Set(saved.map((lesson) => lesson.id));
  const draftIds = new Set(drafts.map((lesson) => lesson.id));
  const membershipChanged =
    saved.length !== drafts.length ||
    saved.some((lesson) => !draftIds.has(lesson.id)) ||
    drafts.some((lesson) => !savedIds.has(lesson.id));

  if (!membershipChanged) {
    return drafts;
  }

  return saved.map((lesson) => {
    const draft = draftById.get(lesson.id);
    if (!draft) return lesson;
    if (
      draft.title === lesson.title &&
      draft.description === lesson.description
    ) {
      return lesson;
    }
    const next = {
      ...lesson,
      title: draft.title,
      description: draft.description,
    };
    return { ...next, order: sortOrderForLesson(next) };
  });
}

export function lessonMembershipMatches(
  a: CurriculumLesson[],
  b: CurriculumLesson[],
): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((lesson) => lesson.id));
  return b.every((lesson) => ids.has(lesson.id));
}

/** True only when membership matches and title/description (etc.) differ. */
export function isLessonDetailsDraftDirty(
  drafts: CurriculumLesson[],
  saved: CurriculumLesson[],
): boolean {
  if (!lessonMembershipMatches(drafts, saved)) return false;
  return JSON.stringify(drafts) !== JSON.stringify(saved);
}
