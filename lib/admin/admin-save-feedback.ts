import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { toAdminErrorFeedback } from "@/lib/admin/format-save-error";
import type { PersistResult } from "@/components/admin/content-store-provider";

export const ADMIN_SAVE_PUBLISHED_MESSAGE =
  "Save successful — your changes have been published for students.";

export function successSaveFeedback(
  message: string = ADMIN_SAVE_PUBLISHED_MESSAGE,
): AdminFeedback {
  return { type: "success", message };
}

export function errorSaveFeedback(error: unknown): AdminFeedback {
  return toAdminErrorFeedback(error);
}

export function applyPersistResult(
  result: PersistResult,
  successMessage: string = ADMIN_SAVE_PUBLISHED_MESSAGE,
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
