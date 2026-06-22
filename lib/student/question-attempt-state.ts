import {
  type QuestionAttemptRecord,
  getQuestionAttemptState,
} from "@/lib/lesson/question-attempt-limits";

type LessonAttemptStore = Record<string, QuestionAttemptRecord>;

type AttemptStore = Record<string, LessonAttemptStore>;

const STORAGE_KEY = "ysg-assignment-question-attempts";

function lessonKey(courseId: string, lessonId: string) {
  return `${courseId}/${lessonId}`;
}

function readStore(): AttemptStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AttemptStore;
  } catch {
    return {};
  }
}

function writeStore(store: AttemptStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadQuestionAttemptRecord(
  courseId: string,
  lessonId: string,
  questionId: string,
): QuestionAttemptRecord | null {
  const store = readStore();
  return store[lessonKey(courseId, lessonId)]?.[questionId] ?? null;
}

export function saveQuestionAttemptRecord(
  courseId: string,
  lessonId: string,
  questionId: string,
  record: QuestionAttemptRecord,
) {
  const store = readStore();
  const key = lessonKey(courseId, lessonId);
  const lesson = store[key] ?? {};
  lesson[questionId] = record;
  store[key] = lesson;
  writeStore(store);
}

export function getResolvedQuestionAttemptState(
  courseId: string,
  lessonId: string,
  questionId: string,
) {
  const record = loadQuestionAttemptRecord(courseId, lessonId, questionId);
  return getQuestionAttemptState(record);
}
