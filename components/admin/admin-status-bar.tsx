"use client";

import { useEffect } from "react";

import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { cn } from "@/lib/utils";

export type AdminStatusBarProps = {
  busy?: boolean;
  busyMessage?: string;
  feedback?: AdminFeedback | null;
  onDismissFeedback?: () => void;
  className?: string;
};

export function AdminStatusBar({
  busy = false,
  busyMessage = "Working…",
  feedback,
  onDismissFeedback,
  className,
}: AdminStatusBarProps) {
  useEffect(() => {
    if (!feedback || feedback.type !== "success" || !onDismissFeedback) return;
    const timer = window.setTimeout(onDismissFeedback, 5000);
    return () => window.clearTimeout(timer);
  }, [feedback, onDismissFeedback]);

  const showBar = busy || Boolean(feedback);
  if (!showBar) return null;

  const isSuccess = feedback?.type === "success";

  return (
    <div
      className={cn(
        "sticky top-14 z-40 space-y-3 rounded-lg border px-4 py-3 shadow-md",
        feedback?.type === "error"
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950"
          : isSuccess
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
            : "border-sky-200 bg-sky-50 dark:border-stone-700 dark:bg-stone-950",
        className,
      )}
    >
      {busy && (
        <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
          {busyMessage}
        </p>
      )}

      {feedback && isSuccess && !busy && (
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {feedback.message}
          </p>
          {onDismissFeedback && (
            <button
              type="button"
              onClick={onDismissFeedback}
              className="shrink-0 rounded px-1 text-xs font-medium text-emerald-800 opacity-70 transition-opacity hover:opacity-100 dark:text-emerald-200"
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {feedback && (!isSuccess || busy) && (
        <AdminActionFeedback
          feedback={feedback}
          onDismiss={onDismissFeedback}
        />
      )}
    </div>
  );
}
