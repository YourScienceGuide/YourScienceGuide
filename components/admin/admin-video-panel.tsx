"use client";

import { useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  getVideoFromStore,
  type LessonVideoMeta,
} from "@/lib/admin/content-store";
import { Button } from "@/components/ui/button";
import { MAX_VIDEO_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_MB, VIDEO_UPLOAD_MODE } from "@/lib/config";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 90;

async function pollForPlaybackId(uploadId: string): Promise<string> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
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

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for video processing. Try again in a moment.");
}

export function AdminVideoPanel() {
  const { store, persist } = useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const [meta, setMeta] = useState<LessonVideoMeta>({
    title: "",
    description: "",
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    const existing = getVideoFromStore(store, courseId, lessonId);
    setMeta(
      existing ?? {
        title: "Lesson video",
        description: "Overview for this lesson.",
      },
    );
  }, [courseId, lessonId, store]);

  function commit(next: LessonVideoMeta) {
    setMeta(next);
    const key = `${courseId}/${lessonId}`;
    void persist({
      ...store,
      videos: { ...store.videos, [key]: next },
    });
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setUploadError(`File must be under ${MAX_VIDEO_UPLOAD_MB} MB.`);
      return;
    }

    setUploadError(null);
    setUploadStatus("Requesting upload URL…");

    try {
      const createRes = await fetch("/api/videos/upload", { method: "POST" });
      if (!createRes.ok) {
        const body = (await createRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to start upload");
      }

      const { url, uploadId } = (await createRes.json()) as {
        url: string;
        uploadId: string;
      };

      setUploadStatus("Uploading video…");
      const putRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "video/mp4" },
      });
      if (!putRes.ok) {
        throw new Error("Upload failed. Check your connection and try again.");
      }

      setUploadStatus("Processing video…");
      const playbackId = await pollForPlaybackId(uploadId);

      commit({
        ...meta,
        muxPlaybackId: playbackId,
        fileName: file.name,
        sourceUrl: undefined,
      });
      setUploadStatus(null);
    } catch (error) {
      setUploadStatus(null);
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  const hasVideo = Boolean(meta.muxPlaybackId || meta.sourceUrl);

  return (
    <div className="space-y-6">
      <AdminLessonPicker
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={setCourseId}
        onLessonChange={setLessonId}
      />

      <div className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Lesson video
        </h2>
        <input
          value={meta.title}
          onChange={(e) => commit({ ...meta, title: e.target.value })}
          placeholder="Video title"
          className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        />
        <textarea
          value={meta.description}
          onChange={(e) => commit({ ...meta, description: e.target.value })}
          placeholder="Video description"
          rows={2}
          className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-stone-300">
            Upload video file
          </label>
          <p className="text-xs text-slate-500 dark:text-stone-500">
            Uploaded to Mux ({VIDEO_UPLOAD_MODE}). Max {MAX_VIDEO_UPLOAD_MB} MB. Only
            playback metadata is stored in this browser.
          </p>
          <input
            type="file"
            accept="video/*"
            disabled={Boolean(uploadStatus)}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm disabled:opacity-50"
          />
          {meta.fileName && (
            <p className="text-xs text-slate-500">Current: {meta.fileName}</p>
          )}
          {uploadStatus && (
            <p className="text-sm text-slate-600 dark:text-stone-400">{uploadStatus}</p>
          )}
          {uploadError && (
            <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
          )}
        </div>
        {meta.muxPlaybackId ? (
          <MuxPlayer
            playbackId={meta.muxPlaybackId}
            className="aspect-video w-full rounded-md"
          />
        ) : meta.sourceUrl ? (
          <video src={meta.sourceUrl} controls className="aspect-video w-full rounded-md" />
        ) : null}
        {hasVideo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={Boolean(uploadStatus)}
            onClick={() =>
              commit({
                title: meta.title,
                description: meta.description,
              })
            }
          >
            Remove uploaded file
          </Button>
        )}
      </div>
    </div>
  );
}
