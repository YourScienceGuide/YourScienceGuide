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
  resolveAdminSelection,
  selectionAfterCourseChange,
  selectionAfterLessonChange,
  writeAdminPreferences,
} from "@/lib/admin/admin-preferences";

type AdminWorkspaceContextValue = {
  courseId: string;
  lessonId: string;
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
    const resolved = resolveAdminSelection(store, prefs);
    setCourseIdState(resolved.courseId);
    setLessonIdState(resolved.lessonId);
    setHydrated(true);
  }, [userLoaded, storeLoading, userId, store, hydrated]);

  useEffect(() => {
    if (!hydrated || !userId) return;

    const resolved = resolveAdminSelection(store, {
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
  }, [store, hydrated, userId, courseId, lessonId]);

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
        courseId: next.courseId,
        lessonId: next.lessonId,
        lessonByCourse: next.lessonByCourse,
      });
    },
    [persist, store, userId],
  );

  const setLessonId = useCallback(
    (nextLessonId: string) => {
      setLessonIdState(nextLessonId);
      if (!userId) return;

      const prefs = readAdminPreferences(userId);
      const next = selectionAfterLessonChange(prefs, courseId, nextLessonId);
      persist(next);
    },
    [courseId, persist, userId],
  );

  const value = useMemo(
    () => ({
      courseId,
      lessonId,
      setCourseId,
      setLessonId,
      ready: hydrated && userLoaded && !storeLoading,
    }),
    [
      courseId,
      lessonId,
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
