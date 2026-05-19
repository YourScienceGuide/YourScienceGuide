"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

type LessonToastProps = {
  message: string | null;
  onDismiss: () => void;
};

export function LessonToast({ message, onDismiss }: LessonToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="fixed inset-x-0 top-16 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <p
        className={cn(
          "max-w-md rounded-lg border px-4 py-3 text-center text-sm font-medium shadow-md",
          "border-sky-200 bg-white text-slate-800",
          "dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100",
        )}
      >
        {message}
      </p>
    </div>
  );
}
