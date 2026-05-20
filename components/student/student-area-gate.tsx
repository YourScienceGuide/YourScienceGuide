"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { StudentPicker } from "@/components/student/student-picker";

export function StudentAreaGate({ children }: { children: ReactNode }) {
  const { isGuest } = useAuth();
  const { ready, needsStudentPicker } = useActiveStudent();

  if (!ready) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!isGuest && needsStudentPicker) {
    return <StudentPicker />;
  }

  return children;
}
