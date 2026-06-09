"use client";

import { useState } from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import { slugifyId } from "@/lib/admin/lesson-key";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminCurriculumPanel() {
  const { store, persist } = useContentStore();
  const [selectedCourseId, setSelectedCourseId] = useState(store.courses[0]?.id ?? "");
  const course = store.courses.find((c) => c.id === selectedCourseId);

  const [newCourse, setNewCourse] = useState({
    title: "",
    subject: "",
    description: "",
    id: "",
  });

  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    unitId: "unit-1",
    unitTitle: "Unit 1",
    order: (course?.lessons.length ?? 0) + 1,
  });

  function saveCourses(courses: Course[]) {
    persist({ ...store, courses });
  }

  function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    const id = slugifyId(newCourse.id || newCourse.title);
    if (!id || store.courses.some((c) => c.id === id)) return;
    const courseEntry: Course = {
      id,
      title: newCourse.title,
      subject: newCourse.subject,
      description: newCourse.description,
      lessons: [],
    };
    saveCourses([...store.courses, courseEntry]);
    setSelectedCourseId(id);
    setNewCourse({ title: "", subject: "", description: "", id: "" });
  }

  function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    const id = slugifyId(newLesson.title);
    if (!id || course.lessons.some((l) => l.id === id)) return;
    const lesson: CurriculumLesson = {
      id,
      unitId: newLesson.unitId,
      unitTitle: newLesson.unitTitle,
      title: newLesson.title,
      description: newLesson.description,
      order: newLesson.order,
    };
    const courses = store.courses.map((c) =>
      c.id === course.id ? { ...c, lessons: [...c.lessons, lesson] } : c,
    );
    saveCourses(courses);
    setNewLesson({
      title: "",
      description: "",
      unitId: newLesson.unitId,
      unitTitle: newLesson.unitTitle,
      order: course.lessons.length + 2,
    });
  }

  function updateLesson(lessonId: string, patch: Partial<CurriculumLesson>) {
    if (!course) return;
    const courses = store.courses.map((c) =>
      c.id === course.id
        ? {
            ...c,
            lessons: c.lessons.map((l) =>
              l.id === lessonId ? { ...l, ...patch } : l,
            ),
          }
        : c,
    );
    saveCourses(courses);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Add curriculum (course)
        </h2>
        <form onSubmit={handleAddCourse} className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Course title"
            value={newCourse.title}
            onChange={(e) => setNewCourse((s) => ({ ...s, title: e.target.value }))}
            required
            className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          />
          <input
            placeholder="Subject"
            value={newCourse.subject}
            onChange={(e) => setNewCourse((s) => ({ ...s, subject: e.target.value }))}
            required
            className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          />
          <input
            placeholder="URL id (optional)"
            value={newCourse.id}
            onChange={(e) => setNewCourse((s) => ({ ...s, id: e.target.value }))}
            className="rounded-md border border-sky-200 px-3 py-2 text-sm sm:col-span-2 dark:border-stone-600 dark:bg-stone-950"
          />
          <textarea
            placeholder="Description"
            value={newCourse.description}
            onChange={(e) => setNewCourse((s) => ({ ...s, description: e.target.value }))}
            required
            rows={2}
            className="rounded-md border border-sky-200 px-3 py-2 text-sm sm:col-span-2 dark:border-stone-600 dark:bg-stone-950"
          />
          <Button type="submit" className="sm:col-span-2 sm:w-fit">
            Add course
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="edit-course" className="text-sm font-medium">
            Edit course
          </label>
          <select
            id="edit-course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          >
            {store.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {course && (
          <>
            <form
              onSubmit={handleAddLesson}
              className="space-y-3 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
            >
              <h3 className="font-medium text-slate-900 dark:text-stone-50">
                Add lesson to {course.title}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="Lesson title"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson((s) => ({ ...s, title: e.target.value }))}
                  required
                  className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Order"
                  value={newLesson.order}
                  onChange={(e) =>
                    setNewLesson((s) => ({ ...s, order: Number(e.target.value) }))
                  }
                  className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
                <input
                  placeholder="Unit id"
                  value={newLesson.unitId}
                  onChange={(e) => setNewLesson((s) => ({ ...s, unitId: e.target.value }))}
                  className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
                <input
                  placeholder="Unit title"
                  value={newLesson.unitTitle}
                  onChange={(e) => setNewLesson((s) => ({ ...s, unitTitle: e.target.value }))}
                  className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
                <textarea
                  placeholder="Lesson description"
                  value={newLesson.description}
                  onChange={(e) =>
                    setNewLesson((s) => ({ ...s, description: e.target.value }))
                  }
                  required
                  rows={2}
                  className="rounded-md border border-sky-200 px-3 py-2 text-sm sm:col-span-2 dark:border-stone-600 dark:bg-stone-950"
                />
              </div>
              <Button type="submit" size="sm">
                Add lesson
              </Button>
            </form>

            <ul className="space-y-3">
              {course.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="space-y-2 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
                >
                  <p className="text-xs text-slate-500">
                    {lesson.unitTitle} · #{lesson.order} · id: {lesson.id}
                    {lesson.chapter != null && lesson.section != null
                      ? ` · CSV Ch.${lesson.chapter} Sec.${lesson.section}`
                      : ""}
                  </p>
                  <input
                    value={lesson.title}
                    onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm font-medium dark:border-stone-600 dark:bg-stone-950"
                  />
                  <textarea
                    value={lesson.description}
                    onChange={(e) =>
                      updateLesson(lesson.id, { description: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-slate-500">
                      CSV Chapter
                      <input
                        type="number"
                        min={1}
                        value={lesson.chapter ?? ""}
                        onChange={(e) =>
                          updateLesson(lesson.id, {
                            chapter: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="e.g. 3"
                        className="mt-1 block w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-500">
                      CSV Section
                      <input
                        type="number"
                        min={1}
                        value={lesson.section ?? ""}
                        onChange={(e) =>
                          updateLesson(lesson.id, {
                            section: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="e.g. 1"
                        className="mt-1 block w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
