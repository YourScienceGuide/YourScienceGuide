"use client";

import Link from "next/link";

import { useContentStore } from "@/components/admin/content-store-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { SwitchStudentButton } from "@/components/student/switch-student-button";
import { getCoursesClient } from "@/lib/student/curriculum-client";
import { coursePath } from "@/lib/student/paths";

export function StudentHub() {
  const { store } = useContentStore();
  const { isGuest } = useAuth();
  const { activeStudent, students } = useActiveStudent();
  const courses = getCoursesClient(store);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
              {activeStudent
                ? `${activeStudent.displayName}'s courses`
                : "Student"}
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-stone-400">
              {activeStudent && students.length > 1
                ? `Learning as ${activeStudent.displayName}. Open a course to see lessons and track progress.`
                : "Your courses and curriculum. Open a course to see all lessons and track what you've completed."}
            </p>
          </div>
          <SwitchStudentButton />
        </div>
      </header>

      {isGuest && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          Guest mode — open any lesson marked Preview without an account. Progress
          is not saved until you sign up, and subscriber lessons stay behind the
          paywall.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={coursePath(course.id)}
            className="group rounded-lg border border-sky-200 bg-white p-6 transition-colors hover:border-sky-300 hover:bg-sky-50/50 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:bg-stone-800/80"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700 dark:text-stone-400">
              {course.subject}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 group-hover:text-sky-800 dark:text-stone-50 dark:group-hover:text-stone-100">
              {course.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
              {course.lessons.length} lessons · {course.description}
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-sky-700 dark:text-stone-300">
              View curriculum →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
