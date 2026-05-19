import { cn } from "@/lib/utils";
import type { LessonStatus } from "@/lib/student/lesson-progress";

const STATUS_CONFIG: Record<
  LessonStatus,
  { label: string; className: string }
> = {
  not_started: {
    label: "Not started",
    className:
      "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  },
  in_progress: {
    label: "In progress",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  complete: {
    label: "Complete",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
