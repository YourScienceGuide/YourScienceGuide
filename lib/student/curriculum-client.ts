import type { AdminContentStore } from "@/lib/admin/content-store";
import {
  getCourseFromStore,
  getCoursesFromStore,
  getLessonFromStore,
} from "@/lib/admin/content-store";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { getLessonsByUnit as getLessonsByUnitBase } from "@/lib/student/curriculum";

export function getCoursesClient(store: AdminContentStore): Course[] {
  return getCoursesFromStore(store);
}

export function getCourseClient(
  store: AdminContentStore,
  courseId: string,
): Course | undefined {
  return getCourseFromStore(store, courseId);
}

export function getLessonClient(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
): CurriculumLesson | undefined {
  return getLessonFromStore(store, courseId, lessonId);
}

export function getLessonsByUnitClient(course: Course) {
  return getLessonsByUnitBase(course);
}

export function getAdjacentLessonsClient(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
) {
  const course = getCourseClient(store, courseId);
  if (!course) return { prev: undefined, next: undefined };
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? course.lessons[index - 1] : undefined,
    next: index < course.lessons.length - 1 ? course.lessons[index + 1] : undefined,
  };
}
