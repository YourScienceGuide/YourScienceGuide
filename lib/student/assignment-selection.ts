import {
  assignmentSeed,
  selectAssignmentQuestions,
  type ChapterQuestion,
} from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";

type SelectionStore = Record<string, string[]>;

const STORAGE_KEY = "ysg-assignment-selection";

function readStore(): SelectionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SelectionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SelectionStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function easyIds(bank: ChapterQuestion[]): string[] {
  return bank.filter((q) => q.difficulty <= 2).map((q) => q.id);
}

function resolveFromStoredIds(
  bank: ChapterQuestion[],
  storedIds: string[],
): LessonQuestion[] | null {
  const easy = new Map(
    bank.filter((q) => q.difficulty <= 2).map((q) => [q.id, q]),
  );
  const resolved = storedIds
    .map((id) => easy.get(id))
    .filter((q): q is ChapterQuestion => q !== undefined);

  if (resolved.length === 0) return null;
  return resolved.map(({ difficulty: _d, ...question }) => question);
}

export function getOrCreateAssignmentQuestions(
  courseId: string,
  lessonId: string,
  bank: ChapterQuestion[],
): LessonQuestion[] {
  const key = assignmentSeed(courseId, lessonId);
  const validEasy = new Set(easyIds(bank));
  const store = readStore();
  const stored = store[key];

  if (stored) {
    const filtered = stored.filter((id) => validEasy.has(id));
    const resolved = resolveFromStoredIds(bank, filtered);
    if (resolved && resolved.length > 0) {
      if (filtered.length !== stored.length) {
        store[key] = filtered;
        writeStore(store);
      }
      return resolved;
    }
  }

  const selected = selectAssignmentQuestions(bank, key);
  store[key] = selected.map((q) => q.id);
  writeStore(store);
  return selected;
}
