import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import {
  compareLessons,
  sortLessons,
} from "@/lib/student/lesson-sort";
import {
  DEFAULT_COURSE_ID,
  SEED_COURSES,
  SEED_LESSONS,
} from "@/lib/student/curriculum-seed";

export type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
export { DEFAULT_COURSE_ID, SEED_COURSES, SEED_LESSONS };

/** Server-safe seed lookup (admin edits apply on the client). */
export function getCourse(courseId: string): Course | undefined {
  return SEED_COURSES.find((c) => c.id === courseId);
}

export function getLesson(
  courseId: string,
  lessonId: string,
): CurriculumLesson | undefined {
  return getCourse(courseId)?.lessons.find((l) => l.id === lessonId);
}

export function getLessonsByChapter(course: Course) {
  const chapters = new Map<
    string,
    { chapterTitle: string; lessons: CurriculumLesson[] }
  >();
  for (const lesson of sortLessons(course.lessons)) {
    const existing = chapters.get(lesson.chapterId);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      chapters.set(lesson.chapterId, {
        chapterTitle: lesson.chapterTitle,
        lessons: [lesson],
      });
    }
  }
  return Array.from(chapters.entries())
    .map(([chapterId, data]) => ({
      chapterId,
      chapterTitle: data.chapterTitle,
      lessons: sortLessons(data.lessons),
    }))
    .sort((a, b) => compareLessons(a.lessons[0], b.lessons[0]));
}

export function getSortedLessons(course: Course): CurriculumLesson[] {
  return sortLessons(course.lessons);
}

export function getAdjacentLessons(courseId: string, lessonId: string) {
  const course = getCourse(courseId);
  if (!course) return { prev: undefined, next: undefined };
  const sorted = getSortedLessons(course);
  const index = sorted.findIndex((l) => l.id === lessonId);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? sorted[index - 1] : undefined,
    next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
  };
}
