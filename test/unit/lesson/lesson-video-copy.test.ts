import { describe, expect, it } from "vitest";

import {
  MOCK_LESSON_VIDEO,
  resolveLessonVideoCopy,
} from "@/lib/lesson/lesson-video-copy";

describe("resolveLessonVideoCopy (admin/videos student display bug)", () => {
  it("uses mock marketing copy only when no lesson video metadata exists", () => {
    const resolved = resolveLessonVideoCopy(undefined);
    expect(resolved.hasSavedMeta).toBe(false);
    expect(resolved.hasUpload).toBe(false);
    expect(resolved.title).toBe(MOCK_LESSON_VIDEO.title);
    expect(resolved.description).toBe(MOCK_LESSON_VIDEO.description);
    expect(resolved.showMetadata).toBe(true);
  });

  it("shows admin title and description when saved without an uploaded video", () => {
    const resolved = resolveLessonVideoCopy({
      title: "Lesson 3: Electrons",
      description: "How electrons behave in atoms.",
    });

    expect(resolved.hasSavedMeta).toBe(true);
    expect(resolved.hasUpload).toBe(false);
    expect(resolved.title).toBe("Lesson 3: Electrons");
    expect(resolved.description).toBe("How electrons behave in atoms.");
    expect(resolved.title).not.toBe(MOCK_LESSON_VIDEO.title);
    expect(resolved.description).not.toBe(MOCK_LESSON_VIDEO.description);
  });

  it("does not fall back to mock copy for blank admin-saved fields", () => {
    const resolved = resolveLessonVideoCopy({
      title: "   ",
      description: "",
    });

    expect(resolved.hasSavedMeta).toBe(true);
    expect(resolved.title).toBe("");
    expect(resolved.description).toBe("");
    expect(resolved.showMetadata).toBe(false);
  });

  it("keeps admin copy when a Mux upload is also present", () => {
    const resolved = resolveLessonVideoCopy({
      title: "Uploaded electrons lesson",
      description: "Watch this overview.",
      muxPlaybackId: "playback-123",
      fileName: "electrons.mp4",
    });

    expect(resolved.hasUpload).toBe(true);
    expect(resolved.title).toBe("Uploaded electrons lesson");
    expect(resolved.description).toBe("Watch this overview.");
  });

  it("trims whitespace from saved admin copy", () => {
    const resolved = resolveLessonVideoCopy({
      title: "  Electrons  ",
      description: "  Overview  ",
    });
    expect(resolved.title).toBe("Electrons");
    expect(resolved.description).toBe("Overview");
  });
});
