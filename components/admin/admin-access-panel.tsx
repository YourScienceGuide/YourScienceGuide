"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { getLessonAccessTier } from "@/lib/student/lesson-access";
import type { LessonAccessTier } from "@/lib/student/curriculum-types";
import { lessonPositionLabel, sortLessons } from "@/lib/student/lesson-sort";
import { ADMIN_SAVE_PUBLISHED_MESSAGE } from "@/lib/admin/admin-save-feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccessTierDraft = Record<string, LessonAccessTier>;

function buildAccessTierDraft(
  lessons: Array<{ id: string; accessTier?: LessonAccessTier }>,
): AccessTierDraft {
  const draft: AccessTierDraft = {};
  for (const lesson of lessons) {
    draft[lesson.id] = getLessonAccessTier(lesson);
  }
  return draft;
}

export function AdminAccessPanel() {
  const { store, persist, saving, actionFeedback, clearActionFeedback } =
    useContentStore();
  const { courseId, setCourseId } = useAdminWorkspace();
  const course = getCourseFromStore(store, courseId);
  const lessons = useMemo(
    () => (course ? sortLessons(course.lessons) : []),
    [course],
  );
  const [draft, setDraft] = useState<AccessTierDraft>({});

  const savedTiersKey = useMemo(
    () =>
      lessons
        .map((lesson) => `${lesson.id}:${getLessonAccessTier(lesson)}`)
        .join("|"),
    [lessons],
  );

  useEffect(() => {
    setDraft(buildAccessTierDraft(lessons));
  }, [courseId, savedTiersKey, lessons]);

  const dirtyLessonIds = useMemo(
    () =>
      lessons
        .filter((lesson) => draft[lesson.id] !== getLessonAccessTier(lesson))
        .map((lesson) => lesson.id),
    [draft, lessons],
  );
  const isDirty = dirtyLessonIds.length > 0;

  const previewCount = lessons.filter(
    (lesson) => (draft[lesson.id] ?? getLessonAccessTier(lesson)) === "preview",
  ).length;

  function updateLessonDraft(lessonId: string, accessTier: LessonAccessTier) {
    setDraft((current) => ({ ...current, [lessonId]: accessTier }));
  }

  function discardChanges() {
    setDraft(buildAccessTierDraft(lessons));
  }

  async function saveChanges() {
    if (!course || !isDirty) return;

    const courses = store.courses.map((entry) =>
      entry.id === course.id
        ? {
            ...entry,
            lessons: entry.lessons.map((lesson) =>
              draft[lesson.id] != null
                ? { ...lesson, accessTier: draft[lesson.id] }
                : lesson,
            ),
          }
        : entry,
    );

    await persist(
      { ...store, courses },
      {
        scope: "structure",
        successMessage: ADMIN_SAVE_PUBLISHED_MESSAGE,
      },
    );
  }

  return (
    <div className="space-y-8">
      <AdminActionFeedback
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
            Lesson access rules
          </h2>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Preview lessons are open without an account or subscription. Subscriber
            lessons stay behind the paywall. Anonymous preview learners can work
            through the lesson, but their progress is not saved.
          </p>
        </div>

        <div className="max-w-md space-y-1">
          <label
            htmlFor="admin-access-course"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Course
          </label>
          <select
            id="admin-access-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          >
            {store.courses.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>

        {course && (
          <div className="rounded-md border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300">
            {previewCount} of {lessons.length} lesson{lessons.length === 1 ? "" : "s"}{" "}
            in <strong>{course.title}</strong>{" "}
            {isDirty ? "would be" : "are"} marked as Preview
            {isDirty ? " after you save" : ""}.
          </div>
        )}
      </section>

      {course ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
              Access by lesson
            </h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Change access per lesson, then save your updates when you are ready.
            </p>
          </div>

          {isDirty && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {dirtyLessonIds.length === 1
                  ? "1 lesson has unsaved access changes."
                  : `${dirtyLessonIds.length} lessons have unsaved access changes.`}{" "}
                Save to apply them.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={discardChanges}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void saveChanges()}
                >
                  {saving ? "Saving…" : "Save access changes"}
                </Button>
              </div>
            </div>
          )}

          <ol className="space-y-3">
            {lessons.map((lesson) => {
              const savedTier = getLessonAccessTier(lesson);
              const accessTier = draft[lesson.id] ?? savedTier;
              const lessonDirty = accessTier !== savedTier;

              return (
                <li
                  key={lesson.id}
                  className={cn(
                    "rounded-lg border bg-white p-4 dark:bg-stone-900",
                    lessonDirty
                      ? "border-amber-300 dark:border-amber-800"
                      : "border-sky-200 dark:border-stone-700",
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
                        {lessonPositionLabel(lesson) || "Lesson"} · {lesson.id}
                      </p>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-stone-400">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="w-full max-w-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`lesson-access-${lesson.id}`}
                          className="text-sm font-medium text-slate-700 dark:text-stone-300"
                        >
                          Access
                        </label>
                        {lessonDirty && (
                          <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <select
                        id={`lesson-access-${lesson.id}`}
                        value={accessTier}
                        onChange={(e) =>
                          updateLessonDraft(
                            lesson.id,
                            e.target.value as LessonAccessTier,
                          )
                        }
                        className={cn(
                          "w-full rounded-md border bg-white px-3 py-2 text-sm dark:bg-stone-950",
                          lessonDirty
                            ? "border-amber-300 dark:border-amber-700"
                            : "border-sky-200 dark:border-stone-600",
                        )}
                      >
                        <option value="preview">Preview</option>
                        <option value="subscriber">Subscription required</option>
                      </select>
                      <p className="text-xs text-slate-500 dark:text-stone-500">
                        {accessTier === "preview"
                          ? "Open to guests and unsubscribed users."
                          : "Requires an active subscription unless the user is an admin."}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {isDirty && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-sky-100 pt-4 dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={discardChanges}
              >
                Discard changes
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void saveChanges()}
              >
                {saving ? "Saving…" : "Save access changes"}
              </Button>
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Select a course to manage lesson access.
        </p>
      )}
    </div>
  );
}
