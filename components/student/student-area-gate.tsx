"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { StudentPicker } from "@/components/student/student-picker";
import { Button } from "@/components/ui/button";

export function StudentAreaGate({ children }: { children: ReactNode }) {
  const { isGuest } = useAuth();
  const { ready, needsStudentPicker, hasNoStudents, studentsSource } =
    useActiveStudent();

  if (!ready) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!isGuest && studentsSource === "unavailable") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        <p>
          Student profiles are unavailable right now. Please try again later or
          contact support if this continues.
        </p>
      </div>
    );
  }

  if (!isGuest && hasNoStudents) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center sm:text-left">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            Add a student to get started
          </h1>
          <p className="text-base text-slate-600 dark:text-stone-400">
            Your account does not have any learners yet. Add a student in the
            parent portal, then return here to open courses.
          </p>
        </header>
        <Button asChild>
          <Link href="/parent/students">Go to parent portal</Link>
        </Button>
      </div>
    );
  }

  if (!isGuest && needsStudentPicker) {
    return <StudentPicker />;
  }

  return children;
}
