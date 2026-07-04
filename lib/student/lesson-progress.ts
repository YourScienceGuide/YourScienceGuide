import type { LessonMachineState } from "@/lib/lesson/state-machine";
import { progressPercent } from "@/lib/lesson/state-machine";
import { MAX_END_OF_CHAPTER_QUESTIONS } from "@/lib/lesson/types";
import type { Course } from "@/lib/student/curriculum";
import { shouldPersistStudentData } from "@/lib/student/student-scope";

export type LessonStatus = "not_started" | "in_progress" | "complete";

export type StoredLessonProgress = Pick<
  LessonMachineState,
  | "questionIndex"
  | "completedCount"
  | "completedQuestionIds"
  | "heldQuestionIds"
  | "isComplete"
>;

/** studentScope -> courseId -> lessonId */
type ProgressStore = Record<string, Record<string, Record<string, StoredLessonProgress>>>;

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
  studentScope: string,
  courseId: string,
  lessonId: string,
): StoredLessonProgress | null {
  if (!shouldPersistStudentData(studentScope)) return null;
  const store = readStore();
  return store[studentScope]?.[courseId]?.[lessonId] ?? null;
}

export function saveLessonProgress(
  studentScope: string,
  courseId: string,
  lessonId: string,
  state: LessonMachineState,
) {
  if (!shouldPersistStudentData(studentScope)) return;
  const store = readStore();
  const byCourse = store[studentScope] ?? {};
  const course = byCourse[courseId] ?? {};
  course[lessonId] = {
    questionIndex: state.questionIndex,
    completedCount:
      state.completedQuestionIds.length > 0
        ? state.completedQuestionIds.length
        : state.completedCount,
    completedQuestionIds: state.completedQuestionIds,
    heldQuestionIds: state.heldQuestionIds,
    isComplete: state.isComplete,
  };
  byCourse[courseId] = course;
  store[studentScope] = byCourse;
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
    completedQuestionIds: stored.completedQuestionIds ?? [],
    heldQuestionIds: stored.heldQuestionIds ?? [],
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
    completedQuestionIds: progress.completedQuestionIds ?? [],
    heldQuestionIds: progress.heldQuestionIds ?? [],
    difficulty: 1,
    feedback: null,
    feedbackTone: null,
    toast: null,
  } as LessonMachineState);
}

export function getCourseCompletionPercent(
  course: Course,
  studentScope: string,
): number {
  if (!shouldPersistStudentData(studentScope)) return 0;
  if (course.lessons.length === 0) return 0;
  const store = readStore();
  const courseProgress = store[studentScope]?.[course.id] ?? {};
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

export function getLessonStatusesForCourse(
  course: Course,
  studentScope: string,
) {
  if (!shouldPersistStudentData(studentScope)) {
    return Object.fromEntries(
      course.lessons.map((lesson) => [lesson.id, "not_started"]),
    ) as Record<string, LessonStatus>;
  }
  const store = readStore();
  const courseProgress = store[studentScope]?.[course.id] ?? {};
  return Object.fromEntries(
    course.lessons.map((lesson) => [
      lesson.id,
      getLessonStatus(courseProgress[lesson.id]),
    ]),
  ) as Record<string, LessonStatus>;
}
