"use client";

import type { ReactNode } from "react";

import { LessonAssessmentProvider } from "@/components/lesson/lesson-assessment-provider";

export function LessonShell({ children }: { children: ReactNode }) {
  return <LessonAssessmentProvider>{children}</LessonAssessmentProvider>;
}
