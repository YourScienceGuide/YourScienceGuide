"use client";

import { useState } from "react";

import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import { AdminTextbookSection } from "@/components/admin/admin-textbook-section";
import {
  courseDeleteConfirmationPhrase,
  lessonDeleteConfirmationPhrase,
  removeCourseFromStore,
  removeLessonFromStore,
} from "@/lib/admin/content-store";
import { slugifyId } from "@/lib/admin/lesson-key";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AdminCurriculumPanel() {
  const { store, persist, saving } = useContentStore();
  const { courseId: selectedCourseId, setCourseId: setSelectedCourseId } =
    useAdminWorkspace();
  const course = store.courses.find((c) => c.id === selectedCourseId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<CurriculumLesson | null>(null);
  const [deleteLessonConfirmText, setDeleteLessonConfirmText] = useState("");

  const [newCourse, setNewCourse] = useState({
    title: "",
    subject: "",
    description: "",
    id: "",
  });

  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    chapterId: "chapter-1",
    chapterTitle: "Chapter 1",
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
      chapterId: newLesson.chapterId,
      chapterTitle: newLesson.chapterTitle,
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
      chapterId: newLesson.chapterId,
      chapterTitle: newLesson.chapterTitle,
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

  const deletePhrase = course ? courseDeleteConfirmationPhrase(course.title) : "";
  const deletePhraseMatches =
    deleteConfirmText.trim() === deletePhrase && deletePhrase.length > 0;
  const canDeleteCourse = store.courses.length > 1;
  const deleteLessonPhrase = lessonToDelete
    ? lessonDeleteConfirmationPhrase(lessonToDelete.title)
    : "";
  const deleteLessonPhraseMatches =
    deleteLessonConfirmText.trim() === deleteLessonPhrase && deleteLessonPhrase.length > 0;

  function openDeleteDialog() {
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  }

  function openDeleteLessonDialog(lesson: CurriculumLesson) {
    setLessonToDelete(lesson);
    setDeleteLessonConfirmText("");
    setDeleteLessonDialogOpen(true);
  }

  async function handleDeleteLesson() {
    if (!course || !lessonToDelete || !deleteLessonPhraseMatches) return;

    const nextStore = removeLessonFromStore(store, course.id, lessonToDelete.id);
    const ok = await persist(nextStore);
    if (!ok) return;

    setDeleteLessonDialogOpen(false);
    setLessonToDelete(null);
    setDeleteLessonConfirmText("");
  }

  async function handleDeleteCourse() {
    if (!course || !deletePhraseMatches || !canDeleteCourse) return;

    const nextStore = removeCourseFromStore(store, course.id);
    const ok = await persist(nextStore);
    if (!ok) return;

    setDeleteDialogOpen(false);
    setDeleteConfirmText("");
    setSelectedCourseId(nextStore.courses[0]?.id ?? "");
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
            <AdminTextbookSection courseId={course.id} courseTitle={course.title} />

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
                  placeholder="Chapter id"
                  value={newLesson.chapterId}
                  onChange={(e) => setNewLesson((s) => ({ ...s, chapterId: e.target.value }))}
                  className="rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
                <input
                  placeholder="Chapter title"
                  value={newLesson.chapterTitle}
                  onChange={(e) => setNewLesson((s) => ({ ...s, chapterTitle: e.target.value }))}
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

            <section className="space-y-3 rounded-lg border border-red-200 bg-red-50/40 p-5 dark:border-red-900/50 dark:bg-red-950/20">
              <h3 className="font-medium text-red-900 dark:text-red-200">Danger zone</h3>
              <p className="text-sm text-red-800/90 dark:text-red-300/90">
                Deleting <strong>{course.title}</strong> removes all{" "}
                {course.lessons.length} lesson
                {course.lessons.length === 1 ? "" : "s"} and every end-of-chapter
                question, Alcumus problem, and video linked to this course. This
                cannot be undone.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canDeleteCourse}
                className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                onClick={openDeleteDialog}
              >
                Delete course…
              </Button>
              {!canDeleteCourse && (
                <p className="text-xs text-red-700 dark:text-red-400">
                  You must keep at least one course in the curriculum.
                </p>
              )}
            </section>

            <ul className="space-y-3">
              {course.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="space-y-2 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      {lesson.chapterTitle} · #{lesson.order} · id: {lesson.id}
                      {lesson.chapter != null && lesson.section != null
                        ? ` · CSV Ch.${lesson.chapter} Sec.${lesson.section}`
                        : ""}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 border-red-300 px-2 text-xs text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                      onClick={() => openDeleteLessonDialog(lesson)}
                    >
                      Delete lesson…
                    </Button>
                  </div>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {course?.title}?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-left">
                <p>
                  This permanently deletes the course and all lesson content tied
                  to it, including questions, Alcumus problems, and videos.
                </p>
                {course && (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>
                      {course.lessons.length} lesson
                      {course.lessons.length === 1 ? "" : "s"}
                    </li>
                    <li>Course id: {course.id}</li>
                  </ul>
                )}
                <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
                  Type the following to confirm:
                </p>
                <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 font-mono text-sm text-slate-800 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100">
                  {deletePhrase}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={deletePhrase}
            aria-label="Confirmation phrase"
            autoComplete="off"
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!deletePhraseMatches || saving || !canDeleteCourse}
              className="border-red-300 text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
              onClick={() => void handleDeleteCourse()}
            >
              {saving ? "Deleting…" : "Delete course permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteLessonDialogOpen}
        onOpenChange={(open) => {
          setDeleteLessonDialogOpen(open);
          if (!open) {
            setLessonToDelete(null);
            setDeleteLessonConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {lessonToDelete?.title}?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-left">
                <p>
                  This permanently removes the lesson from{" "}
                  <strong>{course?.title}</strong> and deletes its end-of-chapter
                  questions, Alcumus problems, and video metadata. This cannot be
                  undone.
                </p>
                {lessonToDelete && course && (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Lesson id: {lessonToDelete.id}</li>
                    <li>Course id: {course.id}</li>
                  </ul>
                )}
                <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
                  Type the following to confirm:
                </p>
                <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 font-mono text-sm text-slate-800 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100">
                  {deleteLessonPhrase}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteLessonConfirmText}
            onChange={(e) => setDeleteLessonConfirmText(e.target.value)}
            placeholder={deleteLessonPhrase}
            aria-label="Confirmation phrase"
            autoComplete="off"
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteLessonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!deleteLessonPhraseMatches || saving}
              className="border-red-300 text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
              onClick={() => void handleDeleteLesson()}
            >
              {saving ? "Deleting…" : "Delete lesson permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
