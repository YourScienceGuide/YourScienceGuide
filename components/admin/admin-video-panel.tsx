"use client";

import { useEffect, useState } from "react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/use-content-store";
import {
  getVideoFromStore,
  saveContentStore,
  type LessonVideoMeta,
} from "@/lib/admin/content-store";
import { Button } from "@/components/ui/button";

const MAX_MB = 25;

export function AdminVideoPanel() {
  const { store, persist } = useContentStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");
  const [meta, setMeta] = useState<LessonVideoMeta>({
    title: "",
    description: "",
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    const updated = {
      ...store,
      videos: { ...store.videos, [key]: next },
    };
    saveContentStore(updated);
    persist(updated);
  }

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_MB} MB for this mock.`);
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      commit({
        ...meta,
        sourceUrl: reader.result as string,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <AdminLessonPicker
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={(id) => {
          setCourseId(id);
          const first = store.courses.find((c) => c.id === id)?.lessons[0]?.id;
          if (first) setLessonId(first);
        }}
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
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {meta.fileName && (
            <p className="text-xs text-slate-500">Current: {meta.fileName}</p>
          )}
          {uploadError && (
            <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
          )}
        </div>
        {meta.sourceUrl && (
          <video src={meta.sourceUrl} controls className="aspect-video w-full rounded-md" />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            commit({
              title: meta.title,
              description: meta.description,
            })
          }
        >
          Remove uploaded file
        </Button>
      </div>
    </div>
  );
}
