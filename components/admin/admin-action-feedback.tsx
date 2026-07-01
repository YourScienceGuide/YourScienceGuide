"use client";

import { cn } from "@/lib/utils";

export type AdminFeedback = {
  type: "success" | "error";
  message: string;
};

type AdminActionFeedbackProps = {
  feedback: AdminFeedback | null;
  onDismiss?: () => void;
  className?: string;
};

export function AdminActionFeedback({
  feedback,
  onDismiss,
  className,
}: AdminActionFeedbackProps) {
  if (!feedback) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        feedback.type === "success" &&
          "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
        feedback.type === "error" &&
          "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
        className,
      )}
    >
      <p className="font-medium leading-snug">{feedback.message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded px-1 text-xs opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss message"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
