import type { LessonMachineState } from "@/lib/lesson/state-machine";
import { progressPercent } from "@/lib/lesson/state-machine";
import { MAX_END_OF_CHAPTER_QUESTIONS } from "@/lib/lesson/types";
import type { Course } from "@/lib/student/curriculum";

export type LessonStatus = "not_started" | "in_progress" | "complete";

export type StoredLessonProgress = Pick<
  LessonMachineState,
  "questionIndex" | "completedCount" | "isComplete"
>;

type ProgressStore = Record<string, Record<string, StoredLessonProgress>>;

const STORAGE_KEY = "ysg-lesson-progress";

function readStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadLessonProgress(
  courseId: string,
  lessonId: string,
): StoredLessonProgress | null {
  const store = readStore();
  return store[courseId]?.[lessonId] ?? null;
}

export function saveLessonProgress(
  courseId: string,
  lessonId: string,
  state: LessonMachineState,
) {
  const store = readStore();
  const course = store[courseId] ?? {};
  course[lessonId] = {
    questionIndex: state.questionIndex,
    completedCount: state.completedCount,
    isComplete: state.isComplete,
  };
  store[courseId] = course;
  writeStore(store);
}

export function getLessonStatus(
  progress: StoredLessonProgress | null | undefined,
): LessonStatus {
  if (!progress) return "not_started";
  if (progress.isComplete) return "complete";
  if (progress.completedCount > 0 || progress.questionIndex > 0) {
    return "in_progress";
  }
  return "not_started";
}

export function storedToMachineState(
  stored: StoredLessonProgress | null,
): Partial<LessonMachineState> | null {
  if (!stored) return null;
  return {
    questionIndex: stored.questionIndex,
    completedCount: stored.completedCount,
    isComplete: stored.isComplete,
    difficulty: 1,
    feedback: null,
    feedbackTone: null,
    toast: null,
  };
}

export function lessonProgressPercent(
  progress: StoredLessonProgress | null | undefined,
  assignmentCount = MAX_END_OF_CHAPTER_QUESTIONS,
): number {
  if (!progress) return 0;
  if (progress.isComplete) return 100;
  return progressPercent({
    ...progress,
    assignmentCount,
    difficulty: 1,
    feedback: null,
    feedbackTone: null,
    toast: null,
  } as LessonMachineState);
}

export function getCourseCompletionPercent(course: Course): number {
  if (course.lessons.length === 0) return 0;
  const store = readStore();
  const courseProgress = store[course.id] ?? {};
  let total = 0;
  for (const lesson of course.lessons) {
    const status = getLessonStatus(courseProgress[lesson.id]);
    if (status === "complete") total += 100;
    else if (status === "in_progress") {
      total += lessonProgressPercent(courseProgress[lesson.id]);
    }
  }
  return Math.round(total / course.lessons.length);
}

export function getLessonStatusesForCourse(course: Course) {
  const store = readStore();
  const courseProgress = store[course.id] ?? {};
  return Object.fromEntries(
    course.lessons.map((lesson) => [
      lesson.id,
      getLessonStatus(courseProgress[lesson.id]),
    ]),
  ) as Record<string, LessonStatus>;
}
