"use client";

import type { AdminContentStore } from "@/lib/admin/content-store";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { lessonPositionLabel, sortLessons } from "@/lib/student/lesson-sort";

type AdminCsvImportRoutingSettingsProps = {
  store: AdminContentStore;
  courseId: string;
  lessonId: string;
  onCourseChange: (courseId: string) => void;
  onLessonChange?: (lessonId: string) => void;
  /** When false, show the fallback lesson as read-only (e.g. embedded on assignment tab). */
  showLessonPicker?: boolean;
  fallbackLessonLabel?: string;
};

export function AdminCsvImportRoutingSettings({
  store,
  courseId,
  lessonId,
  onCourseChange,
  onLessonChange,
  showLessonPicker = true,
  fallbackLessonLabel,
}: AdminCsvImportRoutingSettingsProps) {
  const course = getCourseFromStore(store, courseId);
  const lessons = course ? sortLessons(course.lessons) : [];
  const fallbackLesson = lessons.find((lesson) => lesson.id === lessonId);
  const fallbackDescription =
    fallbackLessonLabel ??
    (fallbackLesson
      ? `${lessonPositionLabel(fallbackLesson) || "Lesson"} · ${fallbackLesson.title}`
      : lessonId);

  return (
    <div className="space-y-3 rounded-md border border-dashed border-sky-200 bg-sky-50/30 px-4 py-3 dark:border-stone-600 dark:bg-stone-950/40">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
          Routing settings
        </p>
        <p className="text-xs text-slate-600 dark:text-stone-400">
          These controls do not restrict your upload to one lesson. They only choose
          which course to match against, and where rows go when Chapter and Section are
          left blank.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="csv-import-course"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Course to match rows against
          </label>
          <select
            id="csv-import-course"
            value={courseId}
            onChange={(e) => onCourseChange(e.target.value)}
            className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          >
            {store.courses.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>

        {showLessonPicker && onLessonChange ? (
          <div className="space-y-1">
            <label
              htmlFor="csv-import-fallback-lesson"
              className="text-sm font-medium text-slate-700 dark:text-stone-300"
            >
              Fallback lesson (blank Chapter/Section only)
            </label>
            <select
              id="csv-import-fallback-lesson"
              value={lessonId}
              onChange={(e) => onLessonChange(e.target.value)}
              className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lessonPositionLabel(lesson) || lesson.title} · {lesson.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
              Fallback lesson (blank Chapter/Section only)
            </p>
            <p className="rounded-md border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
              {fallbackDescription}
            </p>
            <p className="text-xs text-slate-500 dark:text-stone-500">
              Matches the lesson selected at the top of this page. Change that picker to
              update the fallback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
