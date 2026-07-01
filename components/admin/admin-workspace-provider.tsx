"use client";

import { useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import {
  readAdminPreferences,
  resolveAdminWorkspace,
  selectionAfterCourseChange,
  selectionAfterLessonChange,
  writeAdminPreferences,
  type AdminTabId,
} from "@/lib/admin/admin-preferences";

type AdminWorkspaceContextValue = {
  tab: AdminTabId;
  courseId: string;
  lessonId: string;
  setTab: (tab: AdminTabId) => void;
  setCourseId: (courseId: string) => void;
  setLessonId: (lessonId: string) => void;
  ready: boolean;
};

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(
  null,
);

export function AdminWorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { store, loading: storeLoading } = useContentStore();
  const userId = user?.id ?? null;

  const [tab, setTabState] = useState<AdminTabId>("curriculum");
  const [courseId, setCourseIdState] = useState("");
  const [lessonId, setLessonIdState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const persist = useCallback(
    (patch: Parameters<typeof writeAdminPreferences>[1]) => {
      if (!userId) return;
      writeAdminPreferences(userId, patch);
    },
    [userId],
  );

  useEffect(() => {
    if (!userLoaded || storeLoading || hydrated) return;

    const prefs = userId ? readAdminPreferences(userId) : {};
    const resolved = resolveAdminWorkspace(store, prefs);
    setTabState(resolved.tab);
    setCourseIdState(resolved.courseId);
    setLessonIdState(resolved.lessonId);
    setHydrated(true);
  }, [userLoaded, storeLoading, userId, store, hydrated]);

  useEffect(() => {
    if (!hydrated || !userId) return;

    const resolved = resolveAdminWorkspace(store, {
      tab,
      courseId,
      lessonId,
      lessonByCourse: readAdminPreferences(userId).lessonByCourse,
    });

    if (resolved.courseId !== courseId) {
      setCourseIdState(resolved.courseId);
    }
    if (resolved.lessonId !== lessonId) {
      setLessonIdState(resolved.lessonId);
    }
  }, [store, hydrated, userId, tab, courseId, lessonId]);

  const setTab = useCallback(
    (nextTab: AdminTabId) => {
      setTabState(nextTab);
      persist({ tab: nextTab, courseId, lessonId });
    },
    [persist, courseId, lessonId],
  );

  const setCourseId = useCallback(
    (nextCourseId: string) => {
      if (!userId) {
        setCourseIdState(nextCourseId);
        return;
      }

      const prefs = readAdminPreferences(userId);
      const next = selectionAfterCourseChange(store, prefs, nextCourseId);
      setCourseIdState(next.courseId);
      setLessonIdState(next.lessonId);
      persist({
        ...prefs,
        tab,
        courseId: next.courseId,
        lessonId: next.lessonId,
        lessonByCourse: next.lessonByCourse,
      });
    },
    [persist, store, tab, userId],
  );

  const setLessonId = useCallback(
    (nextLessonId: string) => {
      setLessonIdState(nextLessonId);
      if (!userId) return;

      const prefs = readAdminPreferences(userId);
      const next = selectionAfterLessonChange(prefs, courseId, nextLessonId);
      persist({ ...next, tab });
    },
    [courseId, persist, tab, userId],
  );

  const value = useMemo(
    () => ({
      tab,
      courseId,
      lessonId,
      setTab,
      setCourseId,
      setLessonId,
      ready: hydrated && userLoaded && !storeLoading,
    }),
    [
      tab,
      courseId,
      lessonId,
      setTab,
      setCourseId,
      setLessonId,
      hydrated,
      userLoaded,
      storeLoading,
    ],
  );

  return (
    <AdminWorkspaceContext.Provider value={value}>
      {children}
    </AdminWorkspaceContext.Provider>
  );
}

export function useAdminWorkspace() {
  const ctx = useContext(AdminWorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useAdminWorkspace must be used within AdminWorkspaceProvider",
    );
  }
  return ctx;
}
