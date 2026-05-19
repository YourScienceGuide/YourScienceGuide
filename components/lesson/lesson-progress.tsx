import { cn } from "@/lib/utils";

type LessonProgressProps = {
  percent: number;
  label?: string;
};

export function LessonProgress({ percent, label }: LessonProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700 dark:text-stone-300">
          {label ?? "Lesson progress"}
        </span>
        <span className="tabular-nums text-sky-700 dark:text-stone-200">
          {clamped}%
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-sky-100 dark:bg-stone-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lesson completion"
      >
        <div
          className={cn(
            "h-full rounded-full bg-sky-600 transition-all duration-500 ease-out",
            "dark:bg-stone-200",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
