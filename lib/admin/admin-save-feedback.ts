import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { toAdminErrorFeedback } from "@/lib/admin/format-save-error";
import type { PersistResult } from "@/components/admin/content-store-provider";

export function successSaveFeedback(message: string): AdminFeedback {
  return { type: "success", message };
}

export function errorSaveFeedback(error: unknown): AdminFeedback {
  return toAdminErrorFeedback(error);
}

export function applyPersistResult(
  result: PersistResult,
  successMessage: string,
): AdminFeedback | null {
  if (result.ok) {
    return successSaveFeedback(successMessage);
  }
  return errorSaveFeedback(result.error);
}

export function confirmDiscardUnsavedChanges(): boolean {
  return window.confirm(
    "You have unsaved changes on this page. Discard them and continue?",
  );
}
