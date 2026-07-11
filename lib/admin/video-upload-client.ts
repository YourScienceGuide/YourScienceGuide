import type { AdminFeedback } from "@/components/admin/admin-action-feedback";

export type VideoUploadPhase = "starting" | "uploading" | "processing";

export const VIDEO_UPLOAD_PHASE_MESSAGES: Record<VideoUploadPhase, string> = {
  starting: "Requesting upload URL…",
  uploading: "Uploading video…",
  processing: "Processing video…",
};

const VIDEO_FILE_PATTERN = /\.(mp4|mov|webm|m4v|mkv|avi)$/i;

export function validateVideoUploadFile(
  file: File,
  maxBytes: number,
  maxMb: number,
): AdminFeedback | null {
  if (file.size === 0) {
    return {
      type: "error",
      message: "That file is empty.",
      tips: ["Choose a different video file and try again."],
    };
  }

  if (file.size > maxBytes) {
    return {
      type: "error",
      message: `File must be under ${maxMb} MB.`,
      tips: ["Choose a smaller video file or compress it before uploading."],
    };
  }

  const looksLikeVideo =
    file.type.startsWith("video/") || VIDEO_FILE_PATTERN.test(file.name);
  if (!looksLikeVideo) {
    return {
      type: "error",
      message: "Please choose a video file.",
      tips: ["Supported formats include MP4, MOV, and WebM."],
    };
  }

  return null;
}

export async function pollForPlaybackId(
  uploadId: string,
  options?: {
    pollIntervalMs?: number;
    maxAttempts?: number;
  },
): Promise<string> {
  const pollIntervalMs = options?.pollIntervalMs ?? 2000;
  const maxAttempts = options?.maxAttempts ?? 90;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`/api/videos/upload/${uploadId}`);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Failed to check upload status");
    }

    const data = (await res.json()) as {
      status: string;
      playbackId?: string;
      error?: string;
    };

    if (data.status === "ready" && data.playbackId) {
      return data.playbackId;
    }
    if (data.status === "errored") {
      throw new Error(data.error ?? "Video processing failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Timed out waiting for video processing. Try again in a moment.");
}

export async function uploadLessonVideoFile(
  file: File,
  onPhase: (phase: VideoUploadPhase) => void,
): Promise<{ uploadId: string; playbackId: string }> {
  onPhase("starting");
  const createRes = await fetch("/api/videos/upload", { method: "POST" });
  if (!createRes.ok) {
    const body = (await createRes.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to start upload");
  }

  const { url, uploadId } = (await createRes.json()) as {
    url: string;
    uploadId: string;
  };

  onPhase("uploading");
  const putRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "video/mp4" },
  });
  if (!putRes.ok) {
    throw new Error(
      putRes.status >= 500
        ? "Upload failed due to a server error. Try again in a moment."
        : "Upload failed. Check your connection and try again.",
    );
  }

  onPhase("processing");
  const playbackId = await pollForPlaybackId(uploadId);
  return { uploadId, playbackId };
}
