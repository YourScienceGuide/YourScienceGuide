import type { StudentPreferences } from "@/lib/family/types";

const STORAGE_KEY = "ysg-student-preferences";

type PreferencesStore = Record<string, StudentPreferences>;

function readStore(): PreferencesStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PreferencesStore;
  } catch {
    return {};
  }
}

function writeStore(store: PreferencesStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadStudentPreferences(
  studentId: string,
  defaults: StudentPreferences,
): StudentPreferences {
  const stored = readStore()[studentId];
  if (!stored) return defaults;
  return { ...defaults, ...stored };
}

export function saveStudentPreferences(
  studentId: string,
  preferences: StudentPreferences,
) {
  const store = readStore();
  store[studentId] = preferences;
  writeStore(store);
}
