"use client";

import { useEffect, useState } from "react";

import { AdminConfirmDeleteDialog } from "@/components/admin/admin-confirm-delete-dialog";
import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import {
  assignmentQuestionDeletePhrase,
  assignmentQuestionsDeleteAllPhrase,
  getLessonFromStore,
} from "@/lib/admin/content-store";
import { lessonKey } from "@/lib/admin/lesson-key";
import { decodeAssessmentPayload } from "@/lib/ai-guard/encode";
import type { LessonQuestion } from "@/lib/lesson/types";
import { Button } from "@/components/ui/button";

const SEED_TEMPLATE: LessonQuestion[] = [
  {
    type: "multiple-choice",
    id: "q1",
    prompt: "Question 1 prompt",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
  },
  {
    type: "short-answer",
    id: "q2",
    prompt: "Question 2 prompt",
    acceptedAnswers: ["answer"],
  },
  {
    type: "long-answer",
    id: "q3",
    prompt: "Question 3 prompt",
    minLength: 40,
  },
];

type DeleteTarget =
  | { kind: "all" }
  | { kind: "one"; index: number; question: LessonQuestion };

export function AdminAssignmentPanel() {
  const { store, persist, saving } = useContentStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");
  const [seed, setSeed] = useState<LessonQuestion[]>(SEED_TEMPLATE);
  const [questions, setQuestions] = useState<LessonQuestion[]>(SEED_TEMPLATE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const lessonTitle =
    getLessonFromStore(store, courseId, lessonId)?.title ?? "this lesson";

  useEffect(() => {
    async function loadSeed() {
      const res = await fetch("/api/lesson/assessment", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { p: string };
      const data = decodeAssessmentPayload<{ lesson: LessonQuestion[] }>(body.p);
      setSeed(data.lesson);
    }
    loadSeed();
  }, []);

  useEffect(() => {
    const key = lessonKey(courseId, lessonId);
    setQuestions(store.lessonQuestions[key] ?? seed);
  }, [courseId, lessonId, store, seed]);

  function commit(next: LessonQuestion[]) {
    setQuestions(next);
    void persist({
      ...store,
      lessonQuestions: {
        ...store.lessonQuestions,
        [lessonKey(courseId, lessonId)]: next,
      },
    });
  }

  function updateQ(index: number, patch: Partial<LessonQuestion>) {
    const next = questions.map((q, i) =>
      i === index ? ({ ...q, ...patch } as LessonQuestion) : q,
    );
    commit(next);
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
      lessonQuestions: {
        ...store.lessonQuestions,
        [lessonKey(courseId, lessonId)]: next,
      },
    });
    if (!ok) return;
    closeDeleteDialog();
  }

  const deletePhrase =
    deleteTarget?.kind === "all"
      ? assignmentQuestionsDeleteAllPhrase(lessonTitle)
      : deleteTarget?.kind === "one"
        ? assignmentQuestionDeletePhrase(deleteTarget.index + 1)
        : "";

  const deleteTitle =
    deleteTarget?.kind === "all"
      ? `Delete all assignment questions for ${lessonTitle}?`
      : deleteTarget?.kind === "one"
        ? `Delete assignment question ${deleteTarget.index + 1}?`
        : "";

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

      <p className="text-sm text-slate-600 dark:text-stone-400">
        Edit assignment questions for this lesson, or bulk-import end-of-chapter
        questions from CSV below.
      </p>

      <details className="rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-stone-50">
          Bulk import end-of-chapter questions (CSV)
        </summary>
        <div className="mt-4 border-t border-sky-100 pt-4 dark:border-stone-700">
          <AdminCsvImportBlock
            kind="end-of-chapter"
            courseId={courseId}
            lessonId={lessonId}
            onCourseChange={(id) => {
              setCourseId(id);
              const first = store.courses.find((c) => c.id === id)?.lessons[0]?.id;
              if (first) setLessonId(first);
            }}
            onLessonChange={setLessonId}
            showLessonPicker={false}
          />
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
          {questions.length} question{questions.length === 1 ? "" : "s"} for this lesson
        </p>
        {questions.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
            onClick={() => openDeleteDialog({ kind: "all" })}
          >
            Delete all questions…
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
          No assignment questions for this lesson yet.
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
                  {q.type} · Question {index + 1}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 border-red-300 px-2 text-xs text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                  onClick={() => openDeleteDialog({ kind: "one", index, question: q })}
                >
                  Delete question…
                </Button>
              </div>
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
                    Use ________ in the prompt for each blank. Edit accepted answers
                    below (one group per blank, comma-separated variants).
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
            </li>
          ))}
        </ol>
      )}

      <Button type="button" size="sm" variant="ghost" onClick={() => commit(seed)}>
        Reset to API defaults for this lesson
      </Button>

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
                This permanently removes all {questions.length} end-of-chapter assignment
                question{questions.length === 1 ? "" : "s"} for{" "}
                <strong>{lessonTitle}</strong>. Students will see an empty assignment
                section until new questions are added.
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
                This permanently removes assignment question {deleteTarget.index + 1} from{" "}
                <strong>{lessonTitle}</strong>. This cannot be undone.
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
