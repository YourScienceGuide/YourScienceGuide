"use client";

import { useEffect, useMemo, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  applyPersistResult,
  confirmDiscardUnsavedChanges,
} from "@/lib/admin/admin-save-feedback";
import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import {
  getVideoFromStore,
  type LessonVideoMeta,
} from "@/lib/admin/content-store";
import { formatSaveError } from "@/lib/admin/format-save-error";
import { Button } from "@/components/ui/button";
import { MAX_VIDEO_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_MB } from "@/lib/config";

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
  const { store, persist, saving } = useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const savedMeta = useMemo(
    () =>
      getVideoFromStore(store, courseId, lessonId) ?? {
        title: "Lesson video",
        description: "Overview for this lesson.",
      },
    [store, courseId, lessonId],
  );
  const savedKey = useMemo(() => JSON.stringify(savedMeta), [savedMeta]);
  const [draft, setDraft] = useState<LessonVideoMeta>(savedMeta);
  const [saveFeedback, setSaveFeedback] = useState<AdminFeedback | null>(null);
  const [uploadError, setUploadError] = useState<AdminFeedback | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const isDirty = JSON.stringify(draft) !== savedKey;

  useEffect(() => {
    setDraft(savedMeta);
    setSaveFeedback(null);
  }, [courseId, lessonId, savedKey, savedMeta]);

  function handleCourseChange(nextCourseId: string) {
    if (isDirty && !confirmDiscardUnsavedChanges()) return;
    setCourseId(nextCourseId);
  }

  function handleLessonChange(nextLessonId: string) {
    if (isDirty && !confirmDiscardUnsavedChanges()) return;
    setLessonId(nextLessonId);
  }

  async function saveChanges() {
    setSaveFeedback(null);
    const key = `${courseId}/${lessonId}`;
    const result = await persist(
      {
        ...store,
        videos: { ...store.videos, [key]: draft },
      },
      { silent: true },
    );
    setSaveFeedback(
      applyPersistResult(result, "Video details saved for this lesson."),
    );
  }

  function discardChanges() {
    setDraft(savedMeta);
    setSaveFeedback(null);
  }

  async function persistVideoMeta(
    next: LessonVideoMeta,
    successMessage: string,
  ): Promise<boolean> {
    const key = `${courseId}/${lessonId}`;
    const result = await persist(
      {
        ...store,
        videos: { ...store.videos, [key]: next },
      },
      { successMessage },
    );
    if (result.ok) {
      setDraft(next);
      return true;
    }
    setSaveFeedback(applyPersistResult(result, successMessage));
    return false;
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setUploadError({
        type: "error",
        message: `File must be under ${MAX_VIDEO_UPLOAD_MB} MB.`,
        tips: ["Choose a smaller video file or compress it before uploading."],
      });
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

      const ok = await persistVideoMeta(
        {
          ...draft,
          muxPlaybackId: playbackId,
          fileName: file.name,
          sourceUrl: undefined,
        },
        "Video uploaded for this lesson.",
      );
      if (!ok) return;
      setUploadStatus(null);
    } catch (error) {
      setUploadStatus(null);
      const formatted = formatSaveError(error);
      setUploadError({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    }
  }

  const hasVideo = Boolean(draft.muxPlaybackId || draft.sourceUrl);

  return (
    <div className="space-y-6">
      <AdminLessonPicker
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={handleCourseChange}
        onLessonChange={handleLessonChange}
      />

      <AdminSaveBar
        isDirty={isDirty}
        saving={saving}
        feedback={saveFeedback}
        dirtyMessage="You have unsaved video title or description changes."
        onSave={saveChanges}
        onDiscard={discardChanges}
        onDismissFeedback={() => setSaveFeedback(null)}
      />

      <div className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Lesson video
        </h2>
        <input
          value={draft.title}
          onChange={(e) => {
            setSaveFeedback(null);
            setDraft((current) => ({ ...current, title: e.target.value }));
          }}
          placeholder="Video title"
          className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        />
        <textarea
          value={draft.description}
          onChange={(e) => {
            setSaveFeedback(null);
            setDraft((current) => ({ ...current, description: e.target.value }));
          }}
          placeholder="Video description"
          rows={2}
          className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-stone-300">
            Upload video file
          </label>
          <p className="text-xs text-slate-500 dark:text-stone-500">
            MP4 or similar video files. Max {MAX_VIDEO_UPLOAD_MB} MB.
          </p>
          <input
            type="file"
            accept="video/*"
            disabled={Boolean(uploadStatus)}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm disabled:opacity-50"
          />
          {hasVideo && (
            <p className="text-xs text-slate-500">A video is attached to this lesson.</p>
          )}
          {uploadStatus && (
            <p className="text-sm text-slate-600 dark:text-stone-400">{uploadStatus}</p>
          )}
          {uploadError && (
            <AdminActionFeedback
              feedback={uploadError}
              onDismiss={() => setUploadError(null)}
            />
          )}
        </div>
        {draft.muxPlaybackId ? (
          <MuxPlayer
            playbackId={draft.muxPlaybackId}
            className="aspect-video w-full rounded-md"
          />
        ) : draft.sourceUrl ? (
          <video src={draft.sourceUrl} controls className="aspect-video w-full rounded-md" />
        ) : null}
        {hasVideo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={Boolean(uploadStatus)}
            onClick={() =>
              void persistVideoMeta(
                {
                  title: draft.title,
                  description: draft.description,
                },
                "Removed uploaded video from this lesson.",
              )
            }
          >
            Remove uploaded file
          </Button>
        )}
      </div>
    </div>
  );
}
