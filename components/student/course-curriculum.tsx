"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { LessonStatusBadge } from "@/components/student/lesson-status-badge";
import { TextbookCard } from "@/components/student/textbook-card";
import { useCourseProgress } from "@/components/student/use-course-progress";
import { getTextbook } from "@/lib/student/textbook";
import { LessonProgressRail } from "@/components/lesson/lesson-progress-rail";
import type { Course } from "@/lib/student/curriculum";
import { getLessonsByUnit } from "@/lib/student/curriculum";
import { lessonPath } from "@/lib/student/paths";
import { lessonProgressPercent, loadLessonProgress } from "@/lib/student/lesson-progress";
import { cn } from "@/lib/utils";

export function CourseCurriculum({ course }: { course: Course }) {
  const { percent, statuses } = useCourseProgress(course);
  const textbook = getTextbook(course.id);
  const units = getLessonsByUnit(course);
  const completedCount = course.lessons.filter(
    (l) => statuses[l.id] === "complete",
  ).length;

  return (
    <div className="space-y-8">
      <LessonProgressRail
        percent={percent}
        stepLabel={`${completedCount} of ${course.lessons.length} lessons complete`}
        ariaLabel="Course progress"
      />

      <header className="space-y-2">
        <p className="text-sm font-medium text-sky-700 dark:text-stone-400">
          {course.subject}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          {course.title}
        </h1>
        <p className="max-w-2xl text-base text-slate-600 dark:text-stone-400">
          {course.description}
        </p>
      </header>

      {textbook && <TextbookCard textbook={textbook} />}

      <div className="space-y-10">
        {units.map(({ unitId, unitTitle, lessons }) => (
          <section key={unitId} aria-labelledby={`unit-${unitId}`}>
            <h2
              id={`unit-${unitId}`}
              className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-500"
            >
              {unitTitle}
            </h2>
            <ol className="space-y-2">
              {lessons.map((lesson) => {
                const status = statuses[lesson.id] ?? "not_started";
                const stored = loadLessonProgress(course.id, lesson.id);
                const partialPercent =
                  status === "in_progress"
                    ? lessonProgressPercent(stored)
                    : undefined;

                return (
                  <li key={lesson.id}>
                    <Link
                      href={lessonPath(course.id, lesson.id)}
                      className={cn(
                        "group flex items-center gap-4 rounded-lg border px-4 py-4 transition-colors",
                        "border-sky-200 bg-white hover:border-sky-300 hover:bg-sky-50/50",
                        "dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:bg-stone-800/80",
                        status === "complete" &&
                          "border-emerald-200 dark:border-emerald-900/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                          status === "complete"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-sky-100 text-sky-800 dark:bg-stone-800 dark:text-stone-200",
                        )}
                        aria-hidden
                      >
                        {status === "complete" ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          lesson.order
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-stone-50">
                            {lesson.title}
                          </span>
                          <LessonStatusBadge status={status} />
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-600 dark:text-stone-400">
                          {lesson.description}
                        </span>
                        {partialPercent !== undefined && partialPercent > 0 && (
                          <span className="mt-2 block text-xs text-amber-700 dark:text-amber-300">
                            Assignment {partialPercent}% complete
                          </span>
                        )}
                      </span>

                      <ChevronRight
                        className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-stone-500"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
