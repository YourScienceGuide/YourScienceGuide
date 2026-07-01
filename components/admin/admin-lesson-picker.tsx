"use client";

import type { AdminContentStore } from "@/lib/admin/content-store";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { sortLessons, lessonPositionLabel } from "@/lib/student/lesson-sort";

type AdminLessonPickerProps = {
  store: AdminContentStore;
  courseId: string;
  lessonId: string;
  onCourseChange: (courseId: string) => void;
  onLessonChange: (lessonId: string) => void;
};

export function AdminLessonPicker({
  store,
  courseId,
  lessonId,
  onCourseChange,
  onLessonChange,
}: AdminLessonPickerProps) {
  const course = getCourseFromStore(store, courseId);
  const lessons = course ? sortLessons(course.lessons) : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="admin-course" className="text-sm font-medium text-slate-700 dark:text-stone-300">
          Course
        </label>
        <select
          id="admin-course"
          value={courseId}
          onChange={(e) => onCourseChange(e.target.value)}
          className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        >
          {store.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="admin-lesson" className="text-sm font-medium text-slate-700 dark:text-stone-300">
          Lesson
        </label>
        <select
          id="admin-lesson"
          value={lessonId}
          onChange={(e) => onLessonChange(e.target.value)}
          className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {lessonPositionLabel(l) || l.title} · {l.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
