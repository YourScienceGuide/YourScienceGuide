"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { AdminStatusBar } from "@/components/admin/admin-status-bar";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  applyPersistResult,
  confirmDiscardUnsavedChanges,
  errorSaveFeedback,
  successSaveFeedback,
} from "@/lib/admin/admin-save-feedback";
import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import {
  getVideoFromStore,
  type LessonVideoMeta,
} from "@/lib/admin/content-store";
import {
  uploadLessonVideoFile,
  validateVideoUploadFile,
  VIDEO_UPLOAD_PHASE_MESSAGES,
  type VideoUploadPhase,
} from "@/lib/admin/video-upload-client";
import { MAX_VIDEO_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_MB } from "@/lib/config";
import { Button } from "@/components/ui/button";

export function AdminVideoPanel() {
  const { store, persist, saving } = useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedMeta = useMemo(
    () =>
      getVideoFromStore(store, courseId, lessonId) ?? {
        title: "",
        description: "",
      },
    [store, courseId, lessonId],
  );
  const savedKey = useMemo(() => JSON.stringify(savedMeta), [savedMeta]);
  const [draft, setDraft] = useState<LessonVideoMeta>(savedMeta);
  const [saveFeedback, setSaveFeedback] = useState<AdminFeedback | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<AdminFeedback | null>(null);
  const [uploadPhase, setUploadPhase] = useState<VideoUploadPhase | null>(null);
  const [removingVideo, setRemovingVideo] = useState(false);

  const uploading = uploadPhase !== null;
  const isDirty = JSON.stringify(draft) !== savedKey;

  useEffect(() => {
    setDraft(savedMeta);
    setSaveFeedback(null);
    setUploadFeedback(null);
    setUploadPhase(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!isDirty) {
      setDraft(savedMeta);
    }
  }, [savedKey, savedMeta, isDirty]);

  function handleCourseChange(nextCourseId: string) {
    if ((isDirty || uploading) && !confirmDiscardUnsavedChanges()) return;
    setCourseId(nextCourseId);
  }

  function handleLessonChange(nextLessonId: string) {
    if ((isDirty || uploading) && !confirmDiscardUnsavedChanges()) return;
    setLessonId(nextLessonId);
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function saveChanges() {
    setSaveFeedback(null);
    const key = `${courseId}/${lessonId}`;
    const result = await persist(
      {
        ...store,
        videos: { ...store.videos, [key]: draft },
      },
      { silent: true, scope: "videos" },
    );
    setSaveFeedback(applyPersistResult(result));
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
      { silent: true, scope: "videos" },
    );

    if (result.ok) {
      setDraft(next);
      setUploadFeedback(successSaveFeedback(successMessage));
      return true;
    }

    setUploadFeedback(applyPersistResult(result));
    return false;
  }

  async function handleFile(file: File | null) {
    if (!file) return;

    const validationError = validateVideoUploadFile(
      file,
      MAX_VIDEO_UPLOAD_BYTES,
      MAX_VIDEO_UPLOAD_MB,
    );
    if (validationError) {
      setUploadFeedback(validationError);
      resetFileInput();
      return;
    }

    setUploadFeedback(null);
    setSaveFeedback(null);
    setUploadPhase("starting");

    try {
      const { playbackId } = await uploadLessonVideoFile(file, setUploadPhase);
      const nextMeta: LessonVideoMeta = {
        ...draft,
        muxPlaybackId: playbackId,
        fileName: file.name,
        sourceUrl: undefined,
      };

      const saved = await persistVideoMeta(
        nextMeta,
        "Video uploaded and saved for this lesson.",
      );

      if (!saved) {
        setDraft(nextMeta);
        setUploadFeedback({
          type: "error",
          message:
            "Video uploaded, but we couldn't save it to this lesson.",
          tips: [
            "Your video finished uploading — click Save changes above to try again.",
            "If this keeps happening, check your connection or try again later.",
          ],
        });
      }
    } catch (error) {
      setUploadFeedback(errorSaveFeedback(error));
    } finally {
      setUploadPhase(null);
      resetFileInput();
    }
  }

  async function handleRemoveVideo() {
    if (
      !window.confirm(
        "Remove the uploaded video from this lesson? Students will no longer see it until you upload again.",
      )
    ) {
      return;
    }

    setUploadFeedback(null);
    setSaveFeedback(null);
    setRemovingVideo(true);

    try {
      const ok = await persistVideoMeta(
        {
          title: draft.title,
          description: draft.description,
        },
        "Removed uploaded video from this lesson.",
      );
      if (!ok) return;
    } finally {
      setRemovingVideo(false);
      resetFileInput();
    }
  }

  const hasVideo = Boolean(draft.muxPlaybackId || draft.sourceUrl);
  const uploadBusy = uploading || removingVideo;
  const uploadBusyMessage = uploading
    ? VIDEO_UPLOAD_PHASE_MESSAGES[uploadPhase]
    : "Removing video…";

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
        saving={saving && !uploadBusy}
        feedback={saveFeedback}
        dirtyMessage="You have unsaved video title or description changes."
        onSave={saveChanges}
        onDiscard={discardChanges}
        onDismissFeedback={() => setSaveFeedback(null)}
      />

      <AdminStatusBar
        busy={uploadBusy}
        busyMessage={uploadBusyMessage}
        feedback={uploadFeedback}
        onDismissFeedback={() => setUploadFeedback(null)}
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
            MP4, MOV, WebM, or similar video files. Max {MAX_VIDEO_UPLOAD_MB} MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            disabled={uploadBusy || saving}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm disabled:opacity-50"
          />
          {hasVideo && draft.fileName && (
            <p className="text-xs text-slate-500 dark:text-stone-500">
              Current file: {draft.fileName}
            </p>
          )}
          {hasVideo && !draft.fileName && (
            <p className="text-xs text-slate-500 dark:text-stone-500">
              A video is attached to this lesson.
            </p>
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
            disabled={uploadBusy || saving}
            onClick={() => void handleRemoveVideo()}
          >
            {removingVideo ? "Removing…" : "Remove uploaded file"}
          </Button>
        )}
      </div>
    </div>
  );
}
