import Link from "next/link";

import { COURSES } from "@/lib/student/curriculum";
import { coursePath } from "@/lib/student/paths";

export function StudentHub() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Student
        </h1>
        <p className="max-w-2xl text-base text-slate-600 dark:text-stone-400">
          Your courses and curriculum. Open a course to see all lessons and track
          what you&apos;ve completed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {COURSES.map((course) => (
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
