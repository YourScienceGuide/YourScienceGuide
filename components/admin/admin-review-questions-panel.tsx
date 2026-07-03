"use client";

import { useEffect, useState } from "react";

import { AdminConfirmDeleteDialog } from "@/components/admin/admin-confirm-delete-dialog";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { AdminReviewCsvImportBlock } from "@/components/admin/admin-review-csv-import-block";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  getLessonFromStore,
  getReviewQuestionsFromStore,
  reviewQuestionDeletePhrase,
  reviewQuestionsDeleteAllPhrase,
  setReviewQuestionsInStore,
} from "@/lib/admin/content-store";
import type { LessonQuestion } from "@/lib/lesson/types";
import { Button } from "@/components/ui/button";

type DeleteTarget =
  | { kind: "all" }
  | { kind: "one"; index: number; question: LessonQuestion };

function newQuestionId() {
  return `review-${Date.now()}`;
}

export function AdminReviewQuestionsPanel() {
  const { store, persist, saving, actionFeedback, clearActionFeedback } =
    useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const lessonTitle =
    getLessonFromStore(store, courseId, lessonId)?.title ?? "this lesson";

  useEffect(() => {
    setQuestions(getReviewQuestionsFromStore(store, courseId, lessonId));
  }, [courseId, lessonId, store]);

  function commit(next: LessonQuestion[], successMessage?: string) {
    setQuestions(next);
    void persist(
      setReviewQuestionsInStore(store, courseId, lessonId, next),
      successMessage ? { successMessage } : { silent: true },
    );
  }

  function updateQ(index: number, patch: Partial<LessonQuestion>) {
    const next = questions.map((q, i) =>
      i === index ? ({ ...q, ...patch } as LessonQuestion) : q,
    );
    commit(next);
  }

  function addQuestion() {
    commit(
      [
        ...questions,
        {
          type: "multiple-choice",
          id: newQuestionId(),
          prompt: "New review question prompt",
          options: ["Option A", "Option B"],
          correctIndex: 0,
        },
      ],
      "Added a new review question.",
    );
  }

  function openDeleteDialog(target: DeleteTarget) {
    setDeleteTarget(target);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setDeleteConfirmText("");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    const next =
      deleteTarget.kind === "all"
        ? []
        : questions.filter((_, index) => index !== deleteTarget.index);

    setQuestions(next);
    const result = await persist(
      setReviewQuestionsInStore(store, courseId, lessonId, next),
      {
        successMessage:
          deleteTarget.kind === "all"
            ? `Deleted all review questions for ${lessonTitle}.`
            : "Deleted review question.",
      },
    );
    if (!result.ok) return;
    closeDeleteDialog();
  }

  const deletePhrase =
    deleteTarget?.kind === "all"
      ? reviewQuestionsDeleteAllPhrase(lessonTitle)
      : deleteTarget?.kind === "one"
        ? reviewQuestionDeletePhrase(deleteTarget.index + 1)
        : "";

  const deleteTitle =
    deleteTarget?.kind === "all"
      ? `Delete all review questions for ${lessonTitle}?`
      : deleteTarget?.kind === "one"
        ? `Delete review question ${deleteTarget.index + 1}?`
        : "";

  return (
    <div className="space-y-6">
      <AdminActionFeedback
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />

      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 text-sm text-slate-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300">
        <p className="font-medium text-slate-900 dark:text-stone-50">
          Warm-up before the lesson
        </p>
        <p className="mt-2">
          Review questions appear at the top of the student lesson page. Students must
          complete them before readings, the video, and the assignment unlock.
        </p>
      </div>

      <AdminLessonPicker
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={setCourseId}
        onLessonChange={setLessonId}
      />

      <details className="rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-stone-50">
          Bulk import review questions (CSV)
        </summary>
        <div className="mt-4 border-t border-sky-100 pt-4 dark:border-stone-700">
          <AdminReviewCsvImportBlock
            courseId={courseId}
            lessonId={lessonId}
            onCourseChange={setCourseId}
            onLessonChange={setLessonId}
          />
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
          {questions.length} review question{questions.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={addQuestion}>
            Add question
          </Button>
          {questions.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
              onClick={() => openDeleteDialog({ kind: "all" })}
            >
              Delete all…
            </Button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
          No review questions for this lesson yet.
        </p>
      ) : (
        <ol className="space-y-6">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="space-y-3 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase text-slate-500">{q.type}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 border-red-300 px-2 text-xs text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                  onClick={() => openDeleteDialog({ kind: "one", index, question: q })}
                >
                  Delete…
                </Button>
              </div>

              <label className="block text-xs text-slate-500">
                Type
                <select
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    if (type === "multiple-choice") {
                      updateQ(index, {
                        type: "multiple-choice",
                        options: ["Option A", "Option B"],
                        correctIndex: 0,
                      } as Partial<LessonQuestion>);
                    } else if (type === "short-answer") {
                      updateQ(index, {
                        type: "short-answer",
                        acceptedAnswers: [""],
                      } as Partial<LessonQuestion>);
                    } else if (type === "long-answer") {
                      updateQ(index, {
                        type: "long-answer",
                        minLength: 40,
                      } as Partial<LessonQuestion>);
                    } else if (type === "fill-in-the-blank") {
                      updateQ(index, {
                        type: "fill-in-the-blank",
                        prompt: "The answer is ________.",
                        blankAnswers: [[""]],
                      } as Partial<LessonQuestion>);
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                >
                  <option value="multiple-choice">multiple-choice</option>
                  <option value="short-answer">short-answer</option>
                  <option value="long-answer">long-answer</option>
                  <option value="fill-in-the-blank">fill-in-the-blank</option>
                </select>
              </label>

              <textarea
                value={q.prompt}
                onChange={(e) => updateQ(index, { prompt: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
              />

              {q.type === "multiple-choice" && (
                <div className="space-y-2">
                  {q.options.map((opt, optIndex) => (
                    <input
                      key={optIndex}
                      value={opt}
                      onChange={(e) => {
                        const options = [...q.options];
                        options[optIndex] = e.target.value;
                        updateQ(index, { options });
                      }}
                      className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                    />
                  ))}
                  <label className="text-xs text-slate-500">
                    Correct index
                    <input
                      type="number"
                      min={0}
                      value={q.correctIndex}
                      onChange={(e) =>
                        updateQ(index, { correctIndex: Number(e.target.value) })
                      }
                      className="mt-1 block w-24 rounded-md border px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              )}

              {q.type === "short-answer" && (
                <input
                  value={q.acceptedAnswers.join(", ")}
                  onChange={(e) =>
                    updateQ(index, {
                      acceptedAnswers: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Accepted answers, comma-separated"
                  className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
              )}

              {q.type === "long-answer" && (
                <label className="text-xs text-slate-500">
                  Minimum length
                  <input
                    type="number"
                    min={1}
                    value={q.minLength}
                    onChange={(e) =>
                      updateQ(index, { minLength: Number(e.target.value) })
                    }
                    className="mt-1 block w-24 rounded-md border px-2 py-1 text-sm"
                  />
                </label>
              )}

              {q.type === "fill-in-the-blank" && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Use ________ in the prompt for each blank.
                  </p>
                  {q.blankAnswers.map((answers, blankIndex) => (
                    <label key={blankIndex} className="block text-xs text-slate-500">
                      Blank {blankIndex + 1} answers
                      <input
                        value={answers.join(", ")}
                        onChange={(e) => {
                          const blankAnswers = q.blankAnswers.map((group, i) =>
                            i === blankIndex
                              ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                              : group,
                          );
                          updateQ(index, { blankAnswers });
                        }}
                        className="mt-1 block w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                      />
                    </label>
                  ))}
                </div>
              )}

              <label className="block text-xs text-slate-500">
                Hint (shown after a wrong answer)
                <input
                  value={q.hint ?? ""}
                  onChange={(e) => updateQ(index, { hint: e.target.value })}
                  placeholder="Shown when the student misses a try"
                  className="mt-1 block w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
              </label>
            </li>
          ))}
        </ol>
      )}

      <AdminConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
          else setDeleteDialogOpen(true);
        }}
        title={deleteTitle}
        description={
          deleteTarget?.kind === "all" ? (
            <>
              <p>
                This permanently removes all {questions.length} review question
                {questions.length === 1 ? "" : "s"} for <strong>{lessonTitle}</strong>.
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
                Type the following to confirm:
              </p>
              <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 font-mono text-sm text-slate-800 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100">
                {deletePhrase}
              </p>
            </>
          ) : deleteTarget?.kind === "one" ? (
            <>
              <p>
                This permanently removes review question {deleteTarget.index + 1} from{" "}
                <strong>{lessonTitle}</strong>.
              </p>
              <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-slate-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-300">
                {deleteTarget.question.prompt}
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
                Type the following to confirm:
              </p>
              <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 font-mono text-sm text-slate-800 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100">
                {deletePhrase}
              </p>
            </>
          ) : null
        }
        confirmPhrase={deletePhrase}
        confirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        onConfirm={() => void handleConfirmDelete()}
        saving={saving}
        confirmLabel={
          deleteTarget?.kind === "all" ? "Delete all review questions" : "Delete question"
        }
      />
    </div>
  );
}
