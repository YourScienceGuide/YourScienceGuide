"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";

type LessonAssessmentContextValue = {
  lesson: LessonQuestion[];
  alcumus: AlcumusProblem[];
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
  const key = lessonKey(courseId, lessonId);
  const ready = !contentLoading;
  const lesson = ready ? (store.lessonQuestions[key] ?? []) : [];
  const alcumus = ready ? (store.alcumusByLesson[key] ?? []) : [];

  return (
    <LessonAssessmentContext.Provider
      value={{ lesson, alcumus, ready, error: contentError }}
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
