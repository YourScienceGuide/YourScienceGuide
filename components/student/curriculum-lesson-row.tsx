"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { LessonTierBadge } from "@/components/guest/lesson-tier-badge";
import { LessonStatusBadge } from "@/components/student/lesson-status-badge";
import { canGuestOpenLesson } from "@/lib/guest/guest-progress";
import { lessonPositionLabel, lessonSectionNumber } from "@/lib/student/lesson-sort";
import type { CurriculumLesson } from "@/lib/student/curriculum-types";
import { lessonPath } from "@/lib/student/paths";
import type { LessonStatus } from "@/lib/student/lesson-progress";
import { cn } from "@/lib/utils";

type CurriculumLessonRowProps = {
  courseId: string;
  lesson: CurriculumLesson;
  status: LessonStatus;
  partialPercent?: number;
};

export function CurriculumLessonRow({
  courseId,
  lesson,
  status,
  partialPercent,
}: CurriculumLessonRowProps) {
  const { isGuest, openSignupModal } = useAuth();
  const guestLocked = isGuest && !canGuestOpenLesson(lesson);

  const rowClassName = cn(
    "group flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition-colors",
    "border-sky-200 bg-white hover:border-sky-300 hover:bg-sky-50/50",
    "dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:bg-stone-800/80",
    status === "complete" && "border-emerald-200 dark:border-emerald-900/50",
    guestLocked && "cursor-pointer opacity-90",
  );

  const inner = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
          status === "complete"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : guestLocked
              ? "bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-500"
              : "bg-sky-100 text-sky-800 dark:bg-stone-800 dark:text-stone-200",
        )}
        aria-hidden
      >
        {status === "complete" ? (
          <CheckCircle2 className="size-5" />
        ) : (
          lessonSectionNumber(lesson) || "·"
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-stone-50">
            {lesson.title}
          </span>
          {isGuest && <LessonTierBadge lesson={lesson} />}
          {!isGuest && <LessonStatusBadge status={status} />}
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
        className={cn(
          "size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-stone-500",
          guestLocked && "opacity-50",
        )}
        aria-hidden
      />
    </>
  );

  if (guestLocked) {
    return (
      <li>
        <button
          type="button"
          onClick={() => openSignupModal("locked")}
          className={rowClassName}
        >
          {inner}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link href={lessonPath(courseId, lesson.id)} className={rowClassName}>
        {inner}
      </Link>
    </li>
  );
}
