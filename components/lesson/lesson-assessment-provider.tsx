"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import { useStudentScope } from "@/components/student/use-student-scope";
import { getQuestionBankFromStore } from "@/lib/admin/content-store";
import { lessonKey } from "@/lib/admin/lesson-key";
import {
  selectPracticeQuestions,
  type ChapterQuestion,
} from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import { getOrCreateAssignmentQuestions } from "@/lib/student/assignment-selection";

type LessonAssessmentContextValue = {
  bank: ChapterQuestion[];
  lesson: LessonQuestion[];
  practice: ChapterQuestion[];
  ready: boolean;
  error: string | null;
};

const LessonAssessmentContext = createContext<LessonAssessmentContextValue | null>(
  null,
);

type LessonAssessmentProviderProps = {
  courseId: string;
  lessonId: string;
  children: ReactNode;
};

export function LessonAssessmentProvider({
  courseId,
  lessonId,
  children,
}: LessonAssessmentProviderProps) {
  const { store, loading: contentLoading, error: contentError } = useContentStore();
  const studentScope = useStudentScope();
  const key = lessonKey(courseId, lessonId);
  const ready = !contentLoading && studentScope !== null;

  const bank = ready ? getQuestionBankFromStore(store, courseId, lessonId) : [];

  const lesson = useMemo(() => {
    if (!ready || !studentScope || bank.length === 0) return [];
    return getOrCreateAssignmentQuestions(studentScope, courseId, lessonId, bank);
  }, [ready, studentScope, bank, courseId, lessonId]);

  const practice = useMemo(() => {
    if (!ready || bank.length === 0) return [];
    return selectPracticeQuestions(bank, lesson);
  }, [ready, bank, lesson]);

  return (
    <LessonAssessmentContext.Provider
      value={{ bank, lesson, practice, ready, error: contentError }}
    >
      {children}
    </LessonAssessmentContext.Provider>
  );
}

export function useLessonAssessment() {
  const ctx = useContext(LessonAssessmentContext);
  if (!ctx) {
    throw new Error("useLessonAssessment must be used within LessonAssessmentProvider");
  }
  return ctx;
}

/** @deprecated Use practice from useLessonAssessment(). */
export function useLessonAssessmentLegacy() {
  const { lesson, practice, ...rest } = useLessonAssessment();
  return { ...rest, lesson, alcumus: practice };
}
