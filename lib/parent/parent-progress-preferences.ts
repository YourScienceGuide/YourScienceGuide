import type { AdminContentStore } from "@/lib/admin/content-store";

export type ParentProgressPreferences = {
  courseId?: string;
};

type PreferencesByUser = Record<string, ParentProgressPreferences>;

const STORAGE_KEY = "ysg-parent-progress-preferences";

function readAll(): PreferencesByUser {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PreferencesByUser;
  } catch {
    return {};
  }
}

function writeAll(store: PreferencesByUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function readParentProgressPreferences(
  userId: string,
): ParentProgressPreferences {
  return readAll()[userId] ?? {};
}

export function writeParentProgressPreferences(
  userId: string,
  patch: ParentProgressPreferences,
): ParentProgressPreferences {
  const all = readAll();
  const next = { ...all[userId], ...patch };
  all[userId] = next;
  writeAll(all);
  return next;
}

export function resolveParentProgressCourseId(
  store: Pick<AdminContentStore, "courses">,
  prefs: ParentProgressPreferences,
): string {
  const course =
    store.courses.find((c) => c.id === prefs.courseId) ?? store.courses[0];
  return course?.id ?? "";
}
