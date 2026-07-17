"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { useContentStore } from "@/components/admin/content-store-provider";
import type { PersistOptions } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import { AdminLessonPositionEditor } from "@/components/admin/admin-lesson-position-editor";
import { AdminTextbookSection } from "@/components/admin/admin-textbook-section";
import {
  applyPersistResult,
  confirmDiscardUnsavedChanges,
  errorSaveFeedback,
} from "@/lib/admin/admin-save-feedback";
import {
  courseDeleteConfirmationPhrase,
  lessonDeleteConfirmationPhrase,
  removeCourseFromStore,
  removeLessonFromStore,
} from "@/lib/admin/content-store";
import { slugifyId } from "@/lib/admin/lesson-key";
import type { Course, CurriculumLesson } from "@/lib/student/curriculum-types";
import {
  duplicateLessonChapterSectionMessage,
  findLessonWithChapterSection,
  lessonChapterNumber,
  lessonPositionLabel,
  lessonSectionNumber,
  sortLessons,
  sortOrderForLesson,
} from "@/lib/student/lesson-sort";
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

function nextLessonSlot(lessons: CurriculumLesson[]): {
  chapter: number;
  section: number;
  chapterTitle: string;
} {
  if (lessons.length === 0) {
    return { chapter: 1, section: 1, chapterTitle: "Chapter 1" };
  }

  const sorted = sortLessons(lessons);
  const last = sorted[sorted.length - 1];
  const chapter = lessonChapterNumber(last) || 1;
  const section = (lessonSectionNumber(last) || 0) + 1;
  const chapterTitle =
    last.chapterTitle?.trim() || `Chapter ${chapter}`;

  if (!findLessonWithChapterSection(lessons, chapter, section)) {
    return { chapter, section, chapterTitle };
  }

  return {
    chapter: chapter + 1,
    section: 1,
    chapterTitle: `Chapter ${chapter + 1}`,
  };
}

/** Keep title/description edits when the saved lesson list gains/loses lessons. */
function syncLessonDraftsWithSaved(
  saved: CurriculumLesson[],
  drafts: CurriculumLesson[],
): CurriculumLesson[] {
  const draftById = new Map(drafts.map((lesson) => [lesson.id, lesson]));
  const savedIds = new Set(saved.map((lesson) => lesson.id));
  const draftIds = new Set(drafts.map((lesson) => lesson.id));
  const membershipChanged =
    saved.length !== drafts.length ||
    saved.some((lesson) => !draftIds.has(lesson.id)) ||
    drafts.some((lesson) => !savedIds.has(lesson.id));

  if (!membershipChanged) {
    return drafts;
  }

  return saved.map((lesson) => {
    const draft = draftById.get(lesson.id);
    if (!draft) return lesson;
    if (
      draft.title === lesson.title &&
      draft.description === lesson.description
    ) {
      return lesson;
    }
    const next = {
      ...lesson,
      title: draft.title,
      description: draft.description,
    };
    return { ...next, order: sortOrderForLesson(next) };
  });
}

function lessonMembershipMatches(
  a: CurriculumLesson[],
  b: CurriculumLesson[],
): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((lesson) => lesson.id));
  return b.every((lesson) => ids.has(lesson.id));
}

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
    chapter: 1,
    section: 1,
    chapterTitle: "Chapter 1",
  });
  const [addCourseFeedback, setAddCourseFeedback] = useState<AdminFeedback | null>(
    null,
  );
  const [addLessonFeedback, setAddLessonFeedback] = useState<AdminFeedback | null>(
    null,
  );
  const savedLessons = course?.lessons ?? [];
  const savedLessonsKey = useMemo(
    () => JSON.stringify(savedLessons),
    [savedLessons],
  );
  const [lessonDrafts, setLessonDrafts] = useState<CurriculumLesson[]>(savedLessons);
  const [lessonSaveFeedback, setLessonSaveFeedback] = useState<AdminFeedback | null>(
    null,
  );
  const isLessonDraftDirty =
    lessonMembershipMatches(lessonDrafts, savedLessons) &&
    JSON.stringify(lessonDrafts) !== savedLessonsKey;

  useEffect(() => {
    setLessonDrafts(savedLessons);
    setLessonSaveFeedback(null);
    const slot = nextLessonSlot(savedLessons);
    setNewLesson({
      title: "",
      description: "",
      chapter: slot.chapter,
      section: slot.section,
      chapterTitle: slot.chapterTitle,
    });
    setAddLessonFeedback(null);
  }, [selectedCourseId]);

  useEffect(() => {
    setLessonDrafts((current) => {
      const next = syncLessonDraftsWithSaved(savedLessons, current);
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [savedLessonsKey, savedLessons]);

  useEffect(() => {
    setNewLesson((current) => {
      if (current.title.trim() || current.description.trim()) {
        return current;
      }
      const slot = nextLessonSlot(savedLessons);
      if (
        current.chapter === slot.chapter &&
        current.section === slot.section &&
        current.chapterTitle === slot.chapterTitle
      ) {
        return current;
      }
      return {
        ...current,
        chapter: slot.chapter,
        section: slot.section,
        chapterTitle: slot.chapterTitle,
      };
    });
  }, [savedLessonsKey, savedLessons]);

  async function saveCourses(courses: Course[], options?: PersistOptions) {
    return persist(
      { ...store, courses },
      { scope: "structure", ...options },
    );
  }

  function handleSelectedCourseChange(nextCourseId: string) {
    if (isLessonDraftDirty && !confirmDiscardUnsavedChanges()) return;
    setSelectedCourseId(nextCourseId);
  }

  async function handleAddCourse(e: React.FormEvent) {
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
    const result = await saveCourses([...store.courses, courseEntry], {
      successMessage: `Added course "${courseEntry.title}".`,
    });
    if (!result.ok) {
      setAddCourseFeedback(errorSaveFeedback(result.error));
      return;
    }
    setAddCourseFeedback({
      type: "success",
      message: `Added course "${courseEntry.title}".`,
    });
    setSelectedCourseId(id);
    setNewCourse({ title: "", subject: "", description: "", id: "" });
  }

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    const id = slugifyId(newLesson.title);
    if (!id) {
      setAddLessonFeedback({
        type: "error",
        message: "Enter a lesson title that can become a URL id (letters or numbers).",
      });
      return;
    }
    if (course.lessons.some((l) => l.id === id)) {
      setAddLessonFeedback({
        type: "error",
        message: `A lesson with id "${id}" already exists. Choose a different title.`,
      });
      return;
    }

    const chapter = newLesson.chapter;
    const section = newLesson.section;
    const existing = findLessonWithChapterSection(course.lessons, chapter, section);
    if (existing) {
      setAddLessonFeedback({
        type: "error",
        message: duplicateLessonChapterSectionMessage(chapter, section),
      });
      return;
    }

    const chapterId = `chapter-${chapter}`;
    const draft: CurriculumLesson = {
      id,
      chapterId,
      chapterTitle: newLesson.chapterTitle.trim() || `Chapter ${newLesson.chapter}`,
      title: newLesson.title,
      description: newLesson.description,
      chapter: newLesson.chapter,
      section: newLesson.section,
      order: 0,
    };
    const lesson: CurriculumLesson = {
      ...draft,
      order: sortOrderForLesson(draft),
    };

    const courses = store.courses.map((c) =>
      c.id === course.id ? { ...c, lessons: [...c.lessons, lesson] } : c,
    );
    const result = await saveCourses(courses, {
      successMessage: `Added lesson "${lesson.title}" to ${course.title}.`,
    });
    if (!result.ok) {
      setAddLessonFeedback(errorSaveFeedback(result.error));
      return;
    }
    setAddLessonFeedback({
      type: "success",
      message: `Added lesson "${lesson.title}" to ${course.title}.`,
    });
    setLessonSaveFeedback(null);

    const slot = nextLessonSlot([...course.lessons, lesson]);
    setNewLesson({
      title: "",
      description: "",
      chapter: slot.chapter,
      section: slot.section,
      chapterTitle: slot.chapterTitle,
    });
  }

  function updateLessonDraft(lessonId: string, patch: Partial<CurriculumLesson>) {
    if (!course) return;

    setLessonSaveFeedback(null);
    setLessonDrafts((current) =>
      current.map((lesson) => {
        if (lesson.id !== lessonId) return lesson;
        const next = {
          ...lesson,
          ...patch,
          order: sortOrderForLesson({ ...lesson, ...patch }),
        };
        return next;
      }),
    );
  }

  async function saveLessonDetails() {
    if (!course || !isLessonDraftDirty) return;
    if (!lessonMembershipMatches(lessonDrafts, savedLessons)) return;

    const courses = store.courses.map((entry) =>
      entry.id === course.id ? { ...entry, lessons: lessonDrafts } : entry,
    );
    const result = await saveCourses(courses, { silent: true });
    setLessonSaveFeedback(applyPersistResult(result));
  }

  function discardLessonDetails() {
    setLessonDrafts(savedLessons);
    setLessonSaveFeedback(null);
  }

  async function saveLessonPosition(
    lessonId: string,
    position: { chapter: number; section: number },
  ): Promise<boolean> {
    if (!course) return false;

    const current = course.lessons.find((lesson) => lesson.id === lessonId);
    if (!current) return false;

    const next: CurriculumLesson = {
      ...current,
      chapter: position.chapter,
      section: position.section,
      chapterId: `chapter-${position.chapter}`,
      order: sortOrderForLesson({
        ...current,
        chapter: position.chapter,
        section: position.section,
      }),
    };

    const courses = store.courses.map((c) =>
      c.id === course.id
        ? {
            ...c,
            lessons: c.lessons.map((l) => (l.id === lessonId ? next : l)),
          }
        : c,
    );
    const result = await saveCourses(courses, {
      successMessage: "Saved lesson position.",
    });
    if (result.ok) {
      setLessonDrafts((current) =>
        current.map((lesson) => (lesson.id === lessonId ? next : lesson)),
      );
    }
    return result.ok;
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
    const result = await persist(nextStore, {
      scope: "structure",
      successMessage: `Deleted lesson "${lessonToDelete.title}".`,
    });
    if (!result.ok) return;

    setLessonSaveFeedback(null);
    setDeleteLessonDialogOpen(false);
    setLessonToDelete(null);
    setDeleteLessonConfirmText("");
  }

  async function handleDeleteCourse() {
    if (!course || !deletePhraseMatches || !canDeleteCourse) return;

    const nextStore = removeCourseFromStore(store, course.id);
    const result = await persist(nextStore, {
      scope: "structure",
      successMessage: `Deleted course "${course.title}".`,
    });
    if (!result.ok) return;

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
          <Button type="submit" className="sm:col-span-2 sm:w-fit" disabled={saving}>
            {saving ? "Saving…" : "Add course"}
          </Button>
          <AdminActionFeedback
            feedback={addCourseFeedback}
            onDismiss={() => setAddCourseFeedback(null)}
            className="sm:col-span-2"
          />
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
            onChange={(e) => handleSelectedCourseChange(e.target.value)}
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
              <p className="text-sm text-slate-600 dark:text-stone-400">
                Lessons are sorted by <strong>chapter</strong>, then{" "}
                <strong>section</strong> in the course list.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-stone-300">
                    Lesson title
                  </span>
                  <input
                    placeholder="e.g. Introduction to motion"
                    value={newLesson.title}
                    onChange={(e) =>
                      setNewLesson((s) => ({ ...s, title: e.target.value }))
                    }
                    required
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-stone-300">
                    Chapter title
                  </span>
                  <input
                    placeholder="Chapter 1 · Motion"
                    value={newLesson.chapterTitle}
                    onChange={(e) =>
                      setNewLesson((s) => ({ ...s, chapterTitle: e.target.value }))
                    }
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-stone-300">
                    Chapter
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newLesson.chapter}
                    onChange={(e) => {
                      const chapter = Math.max(
                        1,
                        Number.parseInt(e.target.value, 10) || 1,
                      );
                      setNewLesson((s) => ({
                        ...s,
                        chapter,
                        chapterTitle: s.chapterTitle || `Chapter ${chapter}`,
                      }));
                    }}
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-stone-300">
                    Section
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newLesson.section}
                    onChange={(e) =>
                      setNewLesson((s) => ({
                        ...s,
                        section: Math.max(
                          1,
                          Number.parseInt(e.target.value, 10) || 1,
                        ),
                      }))
                    }
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="font-medium text-slate-700 dark:text-stone-300">
                    Lesson description
                  </span>
                  <textarea
                    placeholder="Brief summary for students"
                    value={newLesson.description}
                    onChange={(e) =>
                      setNewLesson((s) => ({ ...s, description: e.target.value }))
                    }
                    required
                    rows={2}
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                </label>
              </div>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving…" : "Add lesson"}
              </Button>
              <AdminActionFeedback
                feedback={addLessonFeedback}
                onDismiss={() => setAddLessonFeedback(null)}
              />
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

            <AdminSaveBar
              isDirty={isLessonDraftDirty}
              saving={saving}
              feedback={lessonSaveFeedback}
              dirtyMessage="You have unsaved lesson title or description changes."
              onSave={saveLessonDetails}
              onDiscard={discardLessonDetails}
              onDismissFeedback={() => setLessonSaveFeedback(null)}
            />

            <ul className="space-y-3">
              {sortLessons(lessonDrafts).map((lesson) => (
                <li
                  key={lesson.id}
                  className="space-y-2 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      {lesson.chapterTitle} · {lessonPositionLabel(lesson)} · id:{" "}
                      {lesson.id}
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
                    onChange={(e) =>
                      updateLessonDraft(lesson.id, { title: e.target.value })
                    }
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm font-medium dark:border-stone-600 dark:bg-stone-950"
                  />
                  <textarea
                    value={lesson.description}
                    onChange={(e) =>
                      updateLessonDraft(lesson.id, { description: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                  />
                  <AdminLessonPositionEditor
                    lesson={lesson}
                    courseLessons={lessonDrafts}
                    saving={saving}
                    onSave={saveLessonPosition}
                  />
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
