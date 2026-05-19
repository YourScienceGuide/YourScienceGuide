"use client";

import { useActiveStudent } from "@/components/family/active-student-provider";
import { cn } from "@/lib/utils";

export function StudentPicker() {
  const { students, selectStudent } = useActiveStudent();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Who is learning today?
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          This account has more than one student. Choose whose courses and
          progress to open.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {students.map((student) => (
          <li key={student.id}>
            <button
              type="button"
              onClick={() => selectStudent(student.id)}
              className={cn(
                "flex w-full flex-col items-start gap-4 rounded-lg border border-sky-200 bg-white p-5 text-left transition-colors",
                "hover:border-sky-300 hover:bg-sky-50/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                "dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:bg-stone-800/80",
                "dark:focus-visible:ring-stone-400 dark:focus-visible:ring-offset-stone-950",
              )}
            >
              <div className="flex w-full items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800 dark:bg-stone-800 dark:text-stone-100"
                  aria-hidden
                >
                  {student.avatarInitials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-stone-50">
                    {student.displayName}
                  </p>
                  <p className="truncate text-sm text-slate-600 dark:text-stone-400">
                    {student.courseName}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-2 text-sm">
                <span className="text-slate-600 dark:text-stone-400">
                  {student.courseProgress}% complete
                </span>
                <span className="font-medium text-sky-700 dark:text-stone-300">
                  Continue →
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-slate-500 sm:text-left dark:text-stone-500">
        Parents can add students and set preferences in the{" "}
        <a
          href="/parent"
          className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-stone-300"
        >
          parent portal
        </a>
        .
      </p>
    </div>
  );
}