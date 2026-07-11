import { describe, expect, it } from "vitest";

import { formatSaveError, isOfflineErrorMessage } from "@/lib/admin/format-save-error";

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
  });

  it("maps generic save failures to actionable guidance", () => {
    const formatted = formatSaveError(new Error("Failed to save content"));
    expect(formatted.message).toBe("We couldn't save your changes.");
    expect(formatted.tips).toContain(
      "Your edits remain on this page — nothing was lost.",
    );
  });

  it("preserves specific server messages with fallback tips", () => {
    const formatted = formatSaveError(new Error("Course id already exists"));
    expect(formatted.message).toBe("Course id already exists");
    expect(formatted.tips.length).toBeGreaterThan(0);
  });
});
