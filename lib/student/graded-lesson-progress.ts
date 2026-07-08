import type { GradedLessonProgress } from "@/lib/lesson/graded-lesson-machine";
import type { GradingRubricConfig } from "@/lib/lesson/lesson-grade-config";
import type { LessonStatus } from "@/lib/student/lesson-progress";
import { shouldPersistStudentData } from "@/lib/student/student-scope";

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
  if (!shouldPersistStudentData(studentScope)) return null;
  const store = readStore();
  return store[studentScope]?.[courseId]?.[lessonId] ?? null;
}

export function saveGradedLessonProgress(
  studentScope: string,
  courseId: string,
  lessonId: string,
  progress: GradedLessonProgress,
) {
  if (!shouldPersistStudentData(studentScope)) return;
  const store = readStore();
  const byCourse = store[studentScope] ?? {};
  const course = byCourse[courseId] ?? {};
  course[lessonId] = progress;
  byCourse[courseId] = course;
  store[studentScope] = byCourse;
  writeStore(store);
}

export function hasGradedLessonActivity(progress: GradedLessonProgress): boolean {
  return (
    progress.reviewCorrectIds.length > 0 ||
    progress.mcCorrectIds.length > 0 ||
    progress.mcCorrectCount > 0 ||
    progress.fibCorrectIds.length > 0 ||
    progress.extraCorrectIds.length > 0 ||
    progress.freeResponseSubmitted ||
    progress.problemsSolved > 0 ||
    progress.graduated
  );
}

export function getGradedLessonStatus(
  progress: GradedLessonProgress | null | undefined,
): LessonStatus {
  if (!progress) return "not_started";
  if (progress.phase === "complete") return "complete";
  if (hasGradedLessonActivity(progress)) return "in_progress";
  return "not_started";
}

export function gradedLessonCompletionPercent(
  progress: GradedLessonProgress | null | undefined,
): number {
  if (!progress) return 0;
  if (progress.phase === "complete") return 100;

  const phases = [
    "review",
    "multiple-choice",
    "fill-in-blank",
    "extra-practice",
    "free-response",
  ] as const;
  const phaseIndex = phases.indexOf(progress.phase);
  if (phaseIndex < 0) return 0;

  const phaseShare = 100 / phases.length;
  const phaseStart = phaseIndex * phaseShare;
  let withinPhase = 0;

  switch (progress.phase) {
    case "review":
      withinPhase = progress.reviewCorrectIds.length + progress.reviewHeldIds.length;
      break;
    case "multiple-choice":
      withinPhase = progress.mcIndex;
      break;
    case "fill-in-blank":
      withinPhase = progress.fibIndex;
      break;
    case "extra-practice":
      withinPhase = progress.extraIndex;
      break;
    case "free-response":
      withinPhase = progress.freeResponseSubmitted ? 1 : 0;
      break;
  }

  const bump =
    withinPhase > 0 ? Math.min(phaseShare * 0.85, phaseShare * 0.5) : 0;
  return Math.min(99, Math.round(phaseStart + bump));
}

/** @deprecated Use gradedLessonCompletionPercent for student-facing progress. */
export function gradedLessonProgressPercent(
  progress: GradedLessonProgress | null | undefined,
  rubric: GradingRubricConfig,
): number {
  void rubric;
  return gradedLessonCompletionPercent(progress);
}
