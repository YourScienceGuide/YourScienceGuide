"use client";

import { useEffect } from "react";

import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";

type AdminActionToastProps = {
  feedback: AdminFeedback | null;
  onDismiss: () => void;
};

export function AdminActionToast({ feedback, onDismiss }: AdminActionToastProps) {
  useEffect(() => {
    if (!feedback || feedback.type !== "success") return;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:justify-end"
      role="presentation"
    >
      <AdminActionFeedback
        feedback={feedback}
        onDismiss={onDismiss}
        className="pointer-events-auto w-full max-w-md shadow-lg"
      />
    </div>
  );
}
