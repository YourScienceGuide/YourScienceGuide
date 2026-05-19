import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LessonProgressRailProps = {
  percent: number;
  stepLabel: string;
  ariaLabel?: string;
  trailing?: ReactNode;
};

export function LessonProgressRail({
  percent,
  stepLabel,
  ariaLabel = "Lesson progress",
  trailing,
}: LessonProgressRailProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={cn(
        "sticky top-14 z-40 -mx-6 border-b border-sky-200 bg-white px-6 py-3",
        "dark:border-stone-700 dark:bg-stone-900",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4 text-sm">
            <span className="truncate font-medium text-slate-800 dark:text-stone-200">
              {stepLabel}
            </span>
            <span className="shrink-0 tabular-nums text-slate-600 dark:text-stone-400">
              {clamped}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-sky-100 sm:max-w-xs dark:bg-stone-800"
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
          >
            <div
              className={cn(
                "h-full rounded-full bg-sky-600 transition-all duration-300",
                "dark:bg-stone-200",
              )}
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );
}
