import { describe, expect, it } from "vitest";

import {
  applyPersistResult,
  errorSaveFeedback,
  ADMIN_SAVE_PUBLISHED_MESSAGE,
} from "@/lib/admin/admin-save-feedback";
import {
  formatSaveError,
  isOfflineErrorMessage,
  toAdminErrorFeedback,
} from "@/lib/admin/format-save-error";

describe("formatSaveError", () => {
  it("maps Failed to fetch to a friendly offline message", () => {
    const formatted = formatSaveError(new Error("Failed to fetch"));
    expect(formatted.message).toBe(
      "No connection — check your internet connection.",
    );
    expect(formatted.tips.length).toBeGreaterThan(0);
  });

  it("detects common offline error strings", () => {
    expect(isOfflineErrorMessage("NetworkError when attempting to fetch resource.")).toBe(
      true,
    );
    expect(isOfflineErrorMessage("Load failed")).toBe(true);
    expect(isOfflineErrorMessage("fetch failed")).toBe(true);
    expect(isOfflineErrorMessage("Network request failed")).toBe(true);
  });

  it("maps generic save failures to actionable guidance", () => {
    for (const message of [
      "Failed to save content",
      "Failed to reset content",
      "Failed to load content",
    ]) {
      const formatted = formatSaveError(new Error(message));
      expect(formatted.message).toBe("We couldn't save your changes.");
      expect(formatted.tips).toContain(
        "Your edits remain on this page — nothing was lost.",
      );
    }
  });

  it("preserves specific server messages with fallback tips", () => {
    const formatted = formatSaveError(new Error("Course id already exists"));
    expect(formatted.message).toBe("Course id already exists");
    expect(formatted.tips.length).toBeGreaterThan(0);
  });

  it("handles string errors and unknown values", () => {
    expect(formatSaveError("Failed to fetch").message).toContain("No connection");
    expect(formatSaveError(null).message).toBe("Something went wrong");
  });
});

describe("toAdminErrorFeedback", () => {
  it("returns error feedback with tips for network failures", () => {
    const feedback = toAdminErrorFeedback(new Error("Failed to fetch"));
    expect(feedback.type).toBe("error");
    expect(feedback.message).toContain("No connection");
    expect(feedback.tips.length).toBeGreaterThan(0);
  });
});

describe("applyPersistResult", () => {
  it("returns published success message on ok", () => {
    const feedback = applyPersistResult({ ok: true });
    expect(feedback?.type).toBe("success");
    expect(feedback?.message).toBe(ADMIN_SAVE_PUBLISHED_MESSAGE);
  });

  it("returns formatted error feedback when persist fails", () => {
    const feedback = applyPersistResult({ ok: false, error: "Failed to save content" });
    expect(feedback?.type).toBe("error");
    expect(feedback?.message).toBe("We couldn't save your changes.");
    expect(feedback?.tips?.length).toBeGreaterThan(0);
  });

  it("maps network errors through applyPersistResult", () => {
    const feedback = applyPersistResult({ ok: false, error: "Failed to fetch" });
    expect(feedback?.message).toContain("No connection");
  });
});

describe("errorSaveFeedback", () => {
  it("wraps database and network errors for admin panels", () => {
    expect(errorSaveFeedback(new Error("Failed to fetch")).message).toContain(
      "No connection",
    );
    expect(errorSaveFeedback("connection timeout").type).toBe("error");
  });
});
