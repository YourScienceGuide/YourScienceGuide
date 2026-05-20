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
import { MOCK_FAMILY_STUDENTS } from "@/lib/family/mock-students";
import {
  loadStudentPreferences,
  saveStudentPreferences,
} from "@/lib/family/student-preferences";
import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";

type ActiveStudentContextValue = {
  ready: boolean;
  students: FamilyStudent[];
  activeStudentId: string | null;
  activeStudent: FamilyStudent | null;
  needsStudentPicker: boolean;
  selectStudent: (studentId: string) => void;
  clearStudent: () => void;
  getPreferences: (studentId: string) => StudentPreferences;
  updatePreferences: (
    studentId: string,
    preferences: StudentPreferences,
  ) => void;
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

  const { hasLessonAccess } = useAuth();
  const students = hasLessonAccess ? MOCK_FAMILY_STUDENTS : [];

  useEffect(() => {
    const stored = readActiveStudentId();
    if (stored && students.some((s) => s.id === stored)) {
      setActiveStudentId(stored);
    } else if (students.length === 1) {
      setActiveStudentId(students[0].id);
      writeActiveStudentId(students[0].id);
    }
    setReady(true);
  }, [students]);

  const selectStudent = useCallback((studentId: string) => {
    writeActiveStudentId(studentId);
    setActiveStudentId(studentId);
  }, []);

  const clearStudent = useCallback(() => {
    clearActiveStudentId();
    setActiveStudentId(null);
  }, []);

  const getPreferences = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      const defaults =
        student?.preferences ?? students[0]?.preferences ?? {
          emailOnLessonComplete: true,
          emailOnGradingRequired: true,
          showGradeOnDashboard: true,
        };
      return loadStudentPreferences(studentId, defaults);
    },
    [students],
  );

  const updatePreferences = useCallback(
    (studentId: string, preferences: StudentPreferences) => {
      saveStudentPreferences(studentId, preferences);
      setPreferencesVersion((v) => v + 1);
    },
    [],
  );

  const activeStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) ?? null,
    [students, activeStudentId],
  );

  const needsStudentPicker =
    ready && students.length > 1 && activeStudentId === null;

  const value = useMemo(
    () => ({
      ready,
      students,
      activeStudentId,
      activeStudent,
      needsStudentPicker,
      selectStudent,
      clearStudent,
      getPreferences,
      updatePreferences,
      preferencesVersion,
    }),
    [
      ready,
      students,
      activeStudentId,
      activeStudent,
      needsStudentPicker,
      selectStudent,
      clearStudent,
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
