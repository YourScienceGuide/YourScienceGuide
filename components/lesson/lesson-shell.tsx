"use client";

import type { ReactNode } from "react";

import { LessonAssessmentProvider } from "@/components/lesson/lesson-assessment-provider";

type LessonShellProps = {
  courseId: string;
  lessonId: string;
  children: ReactNode;
};

export function LessonShell({ courseId, lessonId, children }: LessonShellProps) {
  return (
    <LessonAssessmentProvider courseId={courseId} lessonId={lessonId}>
      {children}
    </LessonAssessmentProvider>
  );
}
