import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { Course } from "@/lib/student/curriculum-types";
import { SEED_COURSES } from "@/lib/student/curriculum-seed";

export type LessonVideoMeta = {
  title: string;
  description: string;
  /** @deprecated Legacy local data-URL uploads — use muxPlaybackId instead. */
  sourceUrl?: string;
  muxPlaybackId?: string;
  fileName?: string;
};

export type AdminContentStore = {
  version: 1 | 2;
  courses: Course[];
  lessonQuestions: Record<string, LessonQuestion[]>;
  alcumusByLesson: Record<string, AlcumusProblem[]>;
  videos: Record<string, LessonVideoMeta>;
};

export const ADMIN_CONTENT_KEY = "ysg-admin-content";
export const CONTENT_UPDATED_EVENT = "ysg-content-updated";
const CURRENT_STORE_VERSION = 2 as const;

function cloneCourses(): Course[] {
  return JSON.parse(JSON.stringify(SEED_COURSES)) as Course[];
}

function stripLegacyVideoBlobs(store: AdminContentStore): {
  store: AdminContentStore;
  changed: boolean;
} {
  let changed = store.version !== CURRENT_STORE_VERSION;
  const videos: Record<string, LessonVideoMeta> = {};

  for (const [key, video] of Object.entries(store.videos ?? {})) {
    if (video.sourceUrl?.startsWith("data:")) {
      changed = true;
      const { sourceUrl: _removed, ...clean } = video;
      videos[key] = clean;
    } else {
      videos[key] = video;
    }
  }

  if (!changed) {
    return { store, changed: false };
  }

  return {
    store: { ...store, version: CURRENT_STORE_VERSION, videos },
    changed: true,
  };
}

function persistStoreSafely(store: AdminContentStore) {
  try {
    localStorage.setItem(ADMIN_CONTENT_KEY, JSON.stringify(store));
    notifyContentUpdated();
    return;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "QuotaExceededError")) {
      throw error;
    }
  }

  const withoutVideos = { ...store, videos: {} };
  localStorage.setItem(ADMIN_CONTENT_KEY, JSON.stringify(withoutVideos));
  notifyContentUpdated();
}

export function createDefaultStore(): AdminContentStore {
  return {
    version: CURRENT_STORE_VERSION,
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

    const { store, changed } = stripLegacyVideoBlobs(parsed);
    if (changed) {
      persistStoreSafely(store);
    }
    return store;
  } catch {
    return createDefaultStore();
  }
}

export function saveContentStore(store: AdminContentStore) {
  const { store: sanitized } = stripLegacyVideoBlobs(store);
  try {
    localStorage.setItem(ADMIN_CONTENT_KEY, JSON.stringify(sanitized));
    notifyContentUpdated();
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error(
        "Browser storage is full. Clear site data for this app or remove older lesson videos, then try again.",
      );
    }
    throw error;
  }
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
