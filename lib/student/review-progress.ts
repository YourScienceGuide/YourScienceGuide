import { progressPercent, type LessonMachineState } from "@/lib/lesson/state-machine";
import { storedToMachineState } from "@/lib/student/lesson-progress";
import { shouldPersistStudentData } from "@/lib/student/student-scope";

export type StoredReviewProgress = Pick<
  LessonMachineState,
  | "questionIndex"
  | "completedCount"
  | "completedQuestionIds"
  | "heldQuestionIds"
  | "isComplete"
>;

/** studentScope -> courseId -> lessonId */
type ReviewProgressStore = Record<
  string,
  Record<string, Record<string, StoredReviewProgress>>
>;

const STORAGE_KEY = "ysg-review-progress";

function readStore(): ReviewProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReviewProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: ReviewProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadReviewProgress(
  studentScope: string,
  courseId: string,
  lessonId: string,
): StoredReviewProgress | null {
  if (!shouldPersistStudentData(studentScope)) return null;
  const store = readStore();
  return store[studentScope]?.[courseId]?.[lessonId] ?? null;
}

export function saveReviewProgress(
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

export function reviewProgressPercent(
  progress: StoredReviewProgress | null | undefined,
  questionCount: number,
): number {
  if (!progress || questionCount <= 0) return 0;
  if (progress.isComplete) return 100;
  const partial = storedToMachineState(progress);
  if (!partial) return 0;
  return progressPercent({
    ...partial,
    assignmentCount: questionCount,
    difficulty: 1,
    feedback: null,
    feedbackTone: null,
    toast: null,
  } as LessonMachineState);
}
