import type { AdminContentStore } from "@/lib/admin/content-store";

export const ADMIN_TABS = [
  "curriculum",
  "import",
  "assignment",
  "videos",
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number];

export type AdminPreferences = {
  tab?: AdminTabId;
  courseId?: string;
  lessonId?: string;
  /** Remember the last edited lesson within each course. */
  lessonByCourse?: Record<string, string>;
};

type PreferencesByUser = Record<string, AdminPreferences>;

const STORAGE_KEY = "ysg-admin-preferences";

const VALID_TABS = new Set<string>(ADMIN_TABS);

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

export function readAdminPreferences(userId: string): AdminPreferences {
  return readAll()[userId] ?? {};
}

export function writeAdminPreferences(
  userId: string,
  patch: AdminPreferences,
): AdminPreferences {
  const all = readAll();
  const next = { ...all[userId], ...patch };
  all[userId] = next;
  writeAll(all);
  return next;
}

export function resolveAdminSelection(
  store: AdminContentStore,
  prefs: AdminPreferences,
): { courseId: string; lessonId: string } {
  const course =
    store.courses.find((c) => c.id === prefs.courseId) ?? store.courses[0];
  const courseId = course?.id ?? "";

  const rememberedLesson = prefs.lessonByCourse?.[courseId];
  const lessonFromPrefs =
    rememberedLesson &&
    course?.lessons.some((lesson) => lesson.id === rememberedLesson)
      ? rememberedLesson
      : prefs.lessonId;

  const lessonId =
    lessonFromPrefs &&
    course?.lessons.some((lesson) => lesson.id === lessonFromPrefs)
      ? lessonFromPrefs
      : (course?.lessons[0]?.id ?? "");

  return { courseId, lessonId };
}

/** @deprecated Use resolveAdminSelection — tab is encoded in the URL. */
export function resolveAdminWorkspace(
  store: AdminContentStore,
  prefs: AdminPreferences,
): { tab: AdminTabId; courseId: string; lessonId: string } {
  const tab =
    prefs.tab && VALID_TABS.has(prefs.tab) ? prefs.tab : "curriculum";
  return { tab, ...resolveAdminSelection(store, prefs) };
}

export function readLastAdminTab(userId: string): AdminTabId {
  const tab = readAdminPreferences(userId).tab;
  return tab && VALID_TABS.has(tab) ? tab : "curriculum";
}

export function rememberAdminTab(userId: string, tab: AdminTabId) {
  writeAdminPreferences(userId, { tab });
}

export function selectionAfterCourseChange(
  store: AdminContentStore,
  prefs: AdminPreferences,
  nextCourseId: string,
): {
  courseId: string;
  lessonId: string;
  lessonByCourse: Record<string, string>;
} {
  const lessonByCourse = { ...(prefs.lessonByCourse ?? {}) };
  if (prefs.courseId && prefs.lessonId) {
    lessonByCourse[prefs.courseId] = prefs.lessonId;
  }

  const course = store.courses.find((c) => c.id === nextCourseId);
  const remembered = lessonByCourse[nextCourseId];
  const lessonId =
    remembered && course?.lessons.some((lesson) => lesson.id === remembered)
      ? remembered
      : (course?.lessons[0]?.id ?? "");

  return {
    courseId: nextCourseId,
    lessonId,
    lessonByCourse,
  };
}

export function selectionAfterLessonChange(
  prefs: AdminPreferences,
  courseId: string,
  lessonId: string,
): AdminPreferences {
  return {
    ...prefs,
    courseId,
    lessonId,
    lessonByCourse: {
      ...(prefs.lessonByCourse ?? {}),
      [courseId]: lessonId,
    },
  };
}
