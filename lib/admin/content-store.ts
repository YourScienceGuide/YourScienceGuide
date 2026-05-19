import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { Course } from "@/lib/student/curriculum-types";
import { SEED_COURSES } from "@/lib/student/curriculum-seed";

export type LessonVideoMeta = {
  title: string;
  description: string;
  sourceUrl?: string;
  fileName?: string;
};

export type AdminContentStore = {
  version: 1;
  courses: Course[];
  lessonQuestions: Record<string, LessonQuestion[]>;
  alcumusByLesson: Record<string, AlcumusProblem[]>;
  videos: Record<string, LessonVideoMeta>;
};

export const ADMIN_CONTENT_KEY = "ysg-admin-content";
export const CONTENT_UPDATED_EVENT = "ysg-content-updated";

function cloneCourses(): Course[] {
  return JSON.parse(JSON.stringify(SEED_COURSES)) as Course[];
}

export function createDefaultStore(): AdminContentStore {
  return {
    version: 1,
    courses: cloneCourses(),
    lessonQuestions: {},
    alcumusByLesson: {},
    videos: {},
  };
}

export function loadContentStore(): AdminContentStore {
  if (typeof window === "undefined") {
    return createDefaultStore();
  }
  try {
    const raw = localStorage.getItem(ADMIN_CONTENT_KEY);
    if (!raw) return createDefaultStore();
    const parsed = JSON.parse(raw) as AdminContentStore;
    if (!parsed.courses?.length) return createDefaultStore();
    return parsed;
  } catch {
    return createDefaultStore();
  }
}

export function saveContentStore(store: AdminContentStore) {
  localStorage.setItem(ADMIN_CONTENT_KEY, JSON.stringify(store));
  notifyContentUpdated();
}

export function notifyContentUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONTENT_UPDATED_EVENT));
  }
}

export function getCoursesFromStore(store: AdminContentStore): Course[] {
  return store.courses;
}

export function getCourseFromStore(
  store: AdminContentStore,
  courseId: string,
): Course | undefined {
  return store.courses.find((c) => c.id === courseId);
}

export function getLessonFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
) {
  return getCourseFromStore(store, courseId)?.lessons.find((l) => l.id === lessonId);
}

export function getLessonQuestionsFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  seedFallback: LessonQuestion[],
): LessonQuestion[] {
  const key = lessonKey(courseId, lessonId);
  return store.lessonQuestions[key] ?? seedFallback;
}

export function getAlcumusFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  seedFallback: AlcumusProblem[],
): AlcumusProblem[] {
  const key = lessonKey(courseId, lessonId);
  return store.alcumusByLesson[key] ?? seedFallback;
}

export function getVideoFromStore(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
) {
  return store.videos[lessonKey(courseId, lessonId)];
}

export function updateCourses(store: AdminContentStore, courses: Course[]) {
  saveContentStore({ ...store, courses });
}

export function updateLessonQuestions(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  questions: LessonQuestion[],
) {
  saveContentStore({
    ...store,
    lessonQuestions: {
      ...store.lessonQuestions,
      [lessonKey(courseId, lessonId)]: questions,
    },
  });
}

export function updateAlcumusForLesson(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  problems: AlcumusProblem[],
) {
  saveContentStore({
    ...store,
    alcumusByLesson: {
      ...store.alcumusByLesson,
      [lessonKey(courseId, lessonId)]: problems,
    },
  });
}

export function updateVideoForLesson(
  store: AdminContentStore,
  courseId: string,
  lessonId: string,
  video: LessonVideoMeta,
) {
  saveContentStore({
    ...store,
    videos: {
      ...store.videos,
      [lessonKey(courseId, lessonId)]: video,
    },
  });
}

export function resetContentStore() {
  saveContentStore(createDefaultStore());
}
