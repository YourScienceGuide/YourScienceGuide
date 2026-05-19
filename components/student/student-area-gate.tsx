"use client";

import type { ReactNode } from "react";

import { useActiveStudent } from "@/components/family/active-student-provider";
import { StudentPicker } from "@/components/student/student-picker";

export function StudentAreaGate({ children }: { children: ReactNode }) {
  const { ready, needsStudentPicker } = useActiveStudent();

  if (!ready) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (needsStudentPicker) {
    return <StudentPicker />;
  }

  return children;
}
