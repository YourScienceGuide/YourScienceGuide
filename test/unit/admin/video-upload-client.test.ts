import { describe, expect, it } from "vitest";

import {
  validateVideoUploadFile,
  VIDEO_UPLOAD_PHASE_MESSAGES,
} from "@/lib/admin/video-upload-client";

describe("validateVideoUploadFile", () => {
  const maxBytes = 100;
  const maxMb = 0;

  it("rejects empty files", () => {
    const file = new File([], "clip.mp4", { type: "video/mp4" });
    const result = validateVideoUploadFile(file, maxBytes, maxMb);
    expect(result?.type).toBe("error");
    expect(result?.message).toMatch(/empty/i);
  });

  it("rejects files over the size limit", () => {
    const file = new File([new Uint8Array(101)], "clip.mp4", { type: "video/mp4" });
    const result = validateVideoUploadFile(file, maxBytes, maxMb);
    expect(result?.type).toBe("error");
    expect(result?.message).toMatch(/under/i);
  });

  it("rejects non-video files", () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const result = validateVideoUploadFile(file, maxBytes, maxMb);
    expect(result?.type).toBe("error");
    expect(result?.message).toMatch(/video file/i);
  });

  it("accepts video files by mime type", () => {
    const file = new File(["x"], "clip.bin", { type: "video/mp4" });
    expect(validateVideoUploadFile(file, maxBytes, maxMb)).toBeNull();
  });

  it("accepts video files by extension when mime is missing", () => {
    const file = new File(["x"], "clip.mov", { type: "" });
    expect(validateVideoUploadFile(file, maxBytes, maxMb)).toBeNull();
  });
});

describe("VIDEO_UPLOAD_PHASE_MESSAGES", () => {
  it("includes user-facing progress labels", () => {
    expect(VIDEO_UPLOAD_PHASE_MESSAGES.starting).toMatch(/upload url/i);
    expect(VIDEO_UPLOAD_PHASE_MESSAGES.uploading).toMatch(/uploading/i);
    expect(VIDEO_UPLOAD_PHASE_MESSAGES.processing).toMatch(/processing/i);
  });
});
