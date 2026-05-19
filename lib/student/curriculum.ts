import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
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

export function getLessonsByUnit(course: Course) {
  const units = new Map<string, { unitTitle: string; lessons: CurriculumLesson[] }>();
  for (const lesson of course.lessons) {
    const existing = units.get(lesson.unitId);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      units.set(lesson.unitId, {
        unitTitle: lesson.unitTitle,
        lessons: [lesson],
      });
    }
  }
  return Array.from(units.entries()).map(([unitId, data]) => ({
    unitId,
    unitTitle: data.unitTitle,
    lessons: data.lessons,
  }));
}

export function getAdjacentLessons(courseId: string, lessonId: string) {
  const course = getCourse(courseId);
  if (!course) return { prev: undefined, next: undefined };
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? course.lessons[index - 1] : undefined,
    next: index < course.lessons.length - 1 ? course.lessons[index + 1] : undefined,
  };
}
