"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { lessonPositionLabel } from "@/lib/student/lesson-sort";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import { coursePath, lessonPath } from "@/lib/student/paths";

type LessonNavProps = {
  courseId: string;
  courseTitle: string;
  lesson: CurriculumLesson;
  prev?: CurriculumLesson;
  next?: CurriculumLesson;
};

export function LessonNav({
  courseId,
  courseTitle,
  lesson,
  prev,
  next,
}: LessonNavProps) {
  return (
    <nav
      className="flex flex-col gap-4 border-b border-sky-200 pb-6 dark:border-stone-700"
      aria-label="Lesson navigation"
    >
      <Button variant="ghost" asChild size="sm" className="w-fit self-start">
        <Link href={coursePath(courseId)}>
          <ArrowLeft aria-hidden />
          {courseTitle}
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
            {lesson.chapterTitle}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            {lesson.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            {lessonPositionLabel(lesson) || "Lesson"} · {lesson.description}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {prev ? (
            <Button variant="ghost" asChild size="sm">
              <Link href={lessonPath(courseId, prev.id)}>
                <ChevronLeft aria-hidden />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeft aria-hidden />
              Previous
            </Button>
          )}
          {next ? (
            <Button variant="ghost" asChild size="sm">
              <Link href={lessonPath(courseId, next.id)}>
                Next
                <ChevronRight aria-hidden />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Next
              <ChevronRight aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
