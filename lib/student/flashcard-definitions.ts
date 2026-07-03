/** studentScope -> lessonKey -> cardId -> student-written definition */
type DefinitionStore = Record<string, Record<string, Record<string, string>>>;

const STORAGE_KEY = "ysg-flashcard-definitions";

function lessonKey(courseId: string, lessonId: string) {
  return `${courseId}/${lessonId}`;
}

function readStore(): DefinitionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DefinitionStore;
  } catch {
    return {};
  }
}

function writeStore(store: DefinitionStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadFlashcardDefinitions(
  studentScope: string,
  courseId: string,
  lessonId: string,
): Record<string, string> {
  const store = readStore();
  return { ...(store[studentScope]?.[lessonKey(courseId, lessonId)] ?? {}) };
}

export function saveFlashcardDefinition(
  studentScope: string,
  courseId: string,
  lessonId: string,
  cardId: string,
  definition: string,
) {
  const store = readStore();
  const key = lessonKey(courseId, lessonId);
  const byStudent = store[studentScope] ?? {};
  const lesson = { ...(byStudent[key] ?? {}) };
  lesson[cardId] = definition;
  byStudent[key] = lesson;
  store[studentScope] = byStudent;
  writeStore(store);
}
