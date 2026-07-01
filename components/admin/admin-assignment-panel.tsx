"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminConfirmDeleteDialog } from "@/components/admin/admin-confirm-delete-dialog";
import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  chapterQuestionDeletePhrase,
  chapterQuestionsDeleteAllPhrase,
  getLessonFromStore,
} from "@/lib/admin/content-store";
import { lessonKey } from "@/lib/admin/lesson-key";
import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import {
  previewChapterSplit,
  type ChapterQuestion,
} from "@/lib/lesson/chapter-questions";
import { LEVEL_LABELS } from "@/lib/lesson/alcumus-machine";
import { Button } from "@/components/ui/button";

type DeleteTarget =
  | { kind: "all" }
  | { kind: "one"; index: number; question: ChapterQuestion };

function newQuestionId() {
  return `custom-${Date.now()}`;
}

export function AdminAssignmentPanel() {
  const { store, persist, saving } = useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const [questions, setQuestions] = useState<ChapterQuestion[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const lessonTitle =
    getLessonFromStore(store, courseId, lessonId)?.title ?? "this lesson";

  const splitPreview = useMemo(() => previewChapterSplit(questions), [questions]);

  useEffect(() => {
    const key = lessonKey(courseId, lessonId);
    setQuestions(store.questionBank[key] ?? []);
  }, [courseId, lessonId, store]);

  function commit(next: ChapterQuestion[]) {
    setQuestions(next);
    void persist({
      ...store,
      questionBank: {
        ...store.questionBank,
        [lessonKey(courseId, lessonId)]: next,
      },
    });
  }

  function updateQ(index: number, patch: Partial<ChapterQuestion>) {
    const next = questions.map((q, i) =>
      i === index ? ({ ...q, ...patch } as ChapterQuestion) : q,
    );
    commit(next);
  }

  function addQuestion() {
    commit([
      ...questions,
      {
        type: "multiple-choice",
        id: newQuestionId(),
        prompt: "New question prompt",
        options: ["Option A", "Option B"],
        correctIndex: 0,
        difficulty: 1,
      },
    ]);
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
    const ok = await persist({
      ...store,
      questionBank: {
        ...store.questionBank,
        [lessonKey(courseId, lessonId)]: next,
      },
    });
    if (!ok) return;
    closeDeleteDialog();
  }

  const deletePhrase =
    deleteTarget?.kind === "all"
      ? chapterQuestionsDeleteAllPhrase(lessonTitle)
      : deleteTarget?.kind === "one"
        ? chapterQuestionDeletePhrase(deleteTarget.index + 1)
        : "";

  const deleteTitle =
    deleteTarget?.kind === "all"
      ? `Delete all chapter questions for ${lessonTitle}?`
      : deleteTarget?.kind === "one"
        ? `Delete chapter question ${deleteTarget.index + 1}?`
        : "";

  return (
    <div className="space-y-6">
      <AdminLessonPicker
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={setCourseId}
        onLessonChange={setLessonId}
      />

      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 text-sm text-slate-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300">
        <p className="font-medium text-slate-900 dark:text-stone-50">
          One question bank per lesson
        </p>
        <p className="mt-2">
          Levels <strong>1–2</strong> are easier and eligible for the required assignment (up to{" "}
          {splitPreview.assignmentSlots} chosen at random per student). Levels{" "}
          <strong>3–5</strong> go to extra practice only. Unselected easy questions also appear in
          extra practice.
        </p>
        <p className="mt-2 text-slate-600 dark:text-stone-400">
          This lesson: {splitPreview.assignmentCandidates} easy question
          {splitPreview.assignmentCandidates === 1 ? "" : "s"} → up to{" "}
          {splitPreview.assignmentSlots} on the assignment · {splitPreview.practiceCount} in extra
          practice
        </p>
      </div>

      <details className="rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-stone-50">
          Bulk import chapter questions (CSV)
        </summary>
        <div className="mt-4 border-t border-sky-100 pt-4 dark:border-stone-700">
          <AdminCsvImportBlock
            kind="chapter"
            courseId={courseId}
            lessonId={lessonId}
            onCourseChange={setCourseId}
            onLessonChange={setLessonId}
            showLessonPicker={false}
          />
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
          {questions.length} question{questions.length === 1 ? "" : "s"} in the bank
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
          No chapter questions for this lesson yet.
        </p>
      ) : (
        <ol className="space-y-6">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="space-y-3 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase text-slate-500">
                  {q.type} · Level {q.difficulty} ({LEVEL_LABELS[q.difficulty]}) ·{" "}
                  {q.difficulty <= 2 ? "Assignment pool" : "Extra practice only"}
                </p>
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
                Difficulty level (1–2 = assignment pool, 3–5 = extra practice)
                <select
                  value={q.difficulty}
                  onChange={(e) =>
                    updateQ(index, { difficulty: Number(e.target.value) as AlcumusLevel })
                  }
                  className="mt-1 block w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                >
                  {([1, 2, 3, 4, 5] as AlcumusLevel[]).map((level) => (
                    <option key={level} value={level}>
                      {level} — {LEVEL_LABELS[level]}
                    </option>
                  ))}
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
                This permanently removes all {questions.length} chapter question
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
                This permanently removes chapter question {deleteTarget.index + 1} from{" "}
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
          deleteTarget?.kind === "all" ? "Delete all questions" : "Delete question"
        }
      />
    </div>
  );
}
