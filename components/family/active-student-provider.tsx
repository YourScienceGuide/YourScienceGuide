"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  clearActiveStudentId,
  readActiveStudentId,
  writeActiveStudentId,
} from "@/lib/family/active-student";
import { notifyProgressUpdated } from "@/components/student/use-course-progress";
import {
  FAMILY_STUDENTS_UPDATED_EVENT,
  MAX_FAMILY_STUDENTS,
} from "@/lib/family/family-students.constants";
import {
  createFamilyStudent as createFamilyStudentApi,
  deleteFamilyStudent as deleteFamilyStudentApi,
  fetchFamilyStudents,
  updateFamilyStudent as updateFamilyStudentApi,
} from "@/lib/family/family-students-client";
import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";

type StudentsSource = "supabase" | "unavailable" | "idle";

type ActiveStudentContextValue = {
  ready: boolean;
  students: FamilyStudent[];
  studentsSource: StudentsSource;
  maxStudents: number;
  activeStudentId: string | null;
  activeStudent: FamilyStudent | null;
  needsStudentPicker: boolean;
  hasNoStudents: boolean;
  selectStudent: (studentId: string) => void;
  clearStudent: () => void;
  refreshStudents: () => Promise<void>;
  addStudent: (name: string, displayName?: string) => Promise<FamilyStudent>;
  removeStudent: (studentId: string) => Promise<void>;
  getPreferences: (studentId: string) => StudentPreferences;
  updatePreferences: (
    studentId: string,
    preferences: StudentPreferences,
  ) => Promise<void>;
  preferencesVersion: number;
};

const ActiveStudentContext = createContext<ActiveStudentContextValue | null>(
  null,
);

export function ActiveStudentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [preferencesVersion, setPreferencesVersion] = useState(0);
  const [students, setStudents] = useState<FamilyStudent[]>([]);
  const [studentsSource, setStudentsSource] = useState<StudentsSource>("idle");
  const [maxStudents, setMaxStudents] = useState(MAX_FAMILY_STUDENTS);

  const { isLoggedIn } = useAuth();

  const refreshStudents = useCallback(async () => {
    if (!isLoggedIn) {
      setStudents([]);
      setStudentsSource("idle");
      return;
    }

    try {
      const result = await fetchFamilyStudents();
      setStudents(result.students);
      setStudentsSource(result.source);
      setMaxStudents(result.maxStudents);
    } catch {
      setStudents([]);
      setStudentsSource("unavailable");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isLoggedIn) {
        setStudents([]);
        setStudentsSource("idle");
        setReady(true);
        return;
      }

      await refreshStudents();
      if (!cancelled) setReady(true);
    }

    setReady(false);
    void load();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, refreshStudents]);

  useEffect(() => {
    const onUpdate = () => {
      void refreshStudents();
    };
    window.addEventListener(FAMILY_STUDENTS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(FAMILY_STUDENTS_UPDATED_EVENT, onUpdate);
  }, [refreshStudents]);

  useEffect(() => {
    if (!ready) return;

    const stored = readActiveStudentId();
    if (stored && students.some((s) => s.id === stored)) {
      setActiveStudentId(stored);
    } else if (students.length === 1) {
      setActiveStudentId(students[0].id);
      writeActiveStudentId(students[0].id);
    } else if (stored && !students.some((s) => s.id === stored)) {
      clearActiveStudentId();
      setActiveStudentId(null);
    }
  }, [ready, students]);

  const selectStudent = useCallback((studentId: string) => {
    writeActiveStudentId(studentId);
    setActiveStudentId(studentId);
    notifyProgressUpdated();
  }, []);

  const clearStudent = useCallback(() => {
    clearActiveStudentId();
    setActiveStudentId(null);
    notifyProgressUpdated();
  }, []);

  const addStudent = useCallback(
    async (name: string, displayName?: string) => {
      const student = await createFamilyStudentApi({ name, displayName });
      setStudents((current) => [...current, student]);
      if (students.length === 0) {
        selectStudent(student.id);
      }
      return student;
    },
    [selectStudent, students.length],
  );

  const removeStudent = useCallback(
    async (studentId: string) => {
      await deleteFamilyStudentApi(studentId);
      setStudents((current) => current.filter((s) => s.id !== studentId));
      if (activeStudentId === studentId) {
        clearStudent();
      }
    },
    [activeStudentId, clearStudent],
  );

  const getPreferences = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      return (
        student?.preferences ?? {
          emailOnLessonComplete: true,
          emailOnGradingRequired: true,
          showGradeOnDashboard: true,
        }
      );
    },
    [students],
  );

  const updatePreferences = useCallback(
    async (studentId: string, preferences: StudentPreferences) => {
      const student = await updateFamilyStudentApi(studentId, { preferences });
      setStudents((current) =>
        current.map((entry) => (entry.id === studentId ? student : entry)),
      );
      setPreferencesVersion((v) => v + 1);
    },
    [],
  );

  const activeStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) ?? null,
    [students, activeStudentId],
  );

  const hasNoStudents =
    ready && isLoggedIn && studentsSource === "supabase" && students.length === 0;

  const needsStudentPicker =
    ready && students.length > 1 && activeStudentId === null;

  const value = useMemo(
    () => ({
      ready,
      students,
      studentsSource,
      maxStudents,
      activeStudentId,
      activeStudent,
      needsStudentPicker,
      hasNoStudents,
      selectStudent,
      clearStudent,
      refreshStudents,
      addStudent,
      removeStudent,
      getPreferences,
      updatePreferences,
      preferencesVersion,
    }),
    [
      ready,
      students,
      studentsSource,
      maxStudents,
      activeStudentId,
      activeStudent,
      needsStudentPicker,
      hasNoStudents,
      selectStudent,
      clearStudent,
      refreshStudents,
      addStudent,
      removeStudent,
      getPreferences,
      updatePreferences,
      preferencesVersion,
    ],
  );

  return (
    <ActiveStudentContext.Provider value={value}>
      {children}
    </ActiveStudentContext.Provider>
  );
}

export function useActiveStudent() {
  const context = useContext(ActiveStudentContext);
  if (!context) {
    throw new Error(
      "useActiveStudent must be used within ActiveStudentProvider",
    );
  }
  return context;
}
