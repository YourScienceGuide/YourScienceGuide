import type { CurriculumLesson } from "@/lib/student/curriculum-types";

/** Parse a numeric chapter from ids like `chapter-3`. */
export function parseChapterFromId(chapterId: string): number | undefined {
  const match = /^chapter-(\d+)$/i.exec(chapterId.trim());
  if (!match) return undefined;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : undefined;
}

export function lessonChapterNumber(lesson: CurriculumLesson): number {
  if (lesson.chapter != null && lesson.chapter > 0) return lesson.chapter;
  const fromId = parseChapterFromId(lesson.chapterId);
  if (fromId != null) return fromId;
  if (lesson.order > 0) return lesson.order;
  return 0;
}

export function lessonSectionNumber(lesson: CurriculumLesson): number {
  if (lesson.section != null && lesson.section > 0) return lesson.section;
  return 0;
}

export function compareLessons(
  a: CurriculumLesson,
  b: CurriculumLesson,
): number {
  const chapterDiff = lessonChapterNumber(a) - lessonChapterNumber(b);
  if (chapterDiff !== 0) return chapterDiff;

  const sectionDiff = lessonSectionNumber(a) - lessonSectionNumber(b);
  if (sectionDiff !== 0) return sectionDiff;

  return a.title.localeCompare(b.title);
}

export function sortLessons(lessons: CurriculumLesson[]): CurriculumLesson[] {
  return [...lessons].sort(compareLessons);
}

/** Stable numeric order for legacy storage (Supabase sort_order). */
export function sortOrderForLesson(lesson: CurriculumLesson): number {
  const chapter = lessonChapterNumber(lesson);
  const section = lessonSectionNumber(lesson);
  return chapter * 1000 + section;
}

export function lessonPositionLabel(lesson: CurriculumLesson): string {
  const chapter = lessonChapterNumber(lesson);
  const section = lessonSectionNumber(lesson);
  if (chapter > 0 && section > 0) return `Ch.${chapter} · Sec.${section}`;
  if (chapter > 0) return `Ch.${chapter}`;
  return "";
}

export function lessonMatchesChapterSection(
  lesson: CurriculumLesson,
  chapter: number,
  section: number,
): boolean {
  return (
    lessonChapterNumber(lesson) === chapter &&
    lessonSectionNumber(lesson) === section
  );
}

export function findLessonWithChapterSection(
  lessons: CurriculumLesson[],
  chapter: number,
  section: number,
  excludeLessonId?: string,
): CurriculumLesson | undefined {
  return lessons.find(
    (lesson) =>
      lesson.id !== excludeLessonId &&
      lessonMatchesChapterSection(lesson, chapter, section),
  );
}

export function duplicateLessonChapterSectionMessage(
  chapter: number,
  section: number,
): string {
  return `Lesson for Chapter ${chapter} section ${section} already exists. Edit the current lesson, or delete it to add a new lesson`;
}
