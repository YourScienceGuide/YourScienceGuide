"use client";

import { useEffect } from "react";

import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminSaveBarProps = {
  isDirty: boolean;
  saving: boolean;
  feedback?: AdminFeedback | null;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onDismissFeedback?: () => void;
  saveLabel?: string;
  discardLabel?: string;
  dirtyMessage?: string;
  className?: string;
};

export function AdminSaveBar({
  isDirty,
  saving,
  feedback,
  onSave,
  onDiscard,
  onDismissFeedback,
  saveLabel = "Save changes",
  discardLabel = "Discard",
  dirtyMessage = "You have unsaved changes.",
  className,
}: AdminSaveBarProps) {
  useEffect(() => {
    if (!feedback || feedback.type !== "success" || !onDismissFeedback) return;
    const timer = window.setTimeout(onDismissFeedback, 5000);
    return () => window.clearTimeout(timer);
  }, [feedback, onDismissFeedback]);

  const showBar =
    isDirty || saving || (feedback?.type === "error" && Boolean(feedback));

  if (!showBar) return null;

  return (
    <div
      className={cn(
        "sticky top-14 z-40 space-y-3 rounded-lg border px-4 py-3 shadow-md",
        feedback?.type === "error"
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950"
          : isDirty
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
            : "border-sky-200 bg-sky-50 dark:border-stone-700 dark:bg-stone-950",
        className,
      )}
    >
      {isDirty && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {dirtyMessage}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={onDiscard}
            >
              {discardLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || !isDirty}
              onClick={() => void onSave()}
            >
              {saving ? "Saving…" : saveLabel}
            </Button>
          </div>
        </div>
      )}

      {!isDirty && saving && (
        <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
          Saving…
        </p>
      )}

      {feedback && (
        <AdminActionFeedback
          feedback={feedback}
          onDismiss={onDismissFeedback}
        />
      )}
    </div>
  );
}
