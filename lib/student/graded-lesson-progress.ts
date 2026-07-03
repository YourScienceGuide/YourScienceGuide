import type { GradedLessonProgress } from "@/lib/lesson/graded-lesson-machine";

/** studentScope -> courseId -> lessonId */
type GradedProgressStore = Record<
  string,
  Record<string, Record<string, GradedLessonProgress>>
>;

const STORAGE_KEY = "ysg-graded-lesson-progress";

function readStore(): GradedProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as GradedProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: GradedProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadGradedLessonProgress(
  studentScope: string,
  courseId: string,
  lessonId: string,
): GradedLessonProgress | null {
  const store = readStore();
  return store[studentScope]?.[courseId]?.[lessonId] ?? null;
}

export function saveGradedLessonProgress(
  studentScope: string,
  courseId: string,
  lessonId: string,
  progress: GradedLessonProgress,
) {
  const store = readStore();
  const byCourse = store[studentScope] ?? {};
  const course = byCourse[courseId] ?? {};
  course[lessonId] = progress;
  byCourse[courseId] = course;
  store[studentScope] = byCourse;
  writeStore(store);
}
