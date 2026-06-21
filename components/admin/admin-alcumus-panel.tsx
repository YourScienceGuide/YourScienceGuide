"use client";

import { useEffect, useState } from "react";

import { AdminConfirmDeleteDialog } from "@/components/admin/admin-confirm-delete-dialog";
import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import {
  alcumusProblemDeletePhrase,
  alcumusProblemsDeleteAllPhrase,
  getLessonFromStore,
} from "@/lib/admin/content-store";
import { lessonKey } from "@/lib/admin/lesson-key";
import { decodeAssessmentPayload } from "@/lib/ai-guard/encode";
import type { AlcumusLevel, AlcumusProblem } from "@/lib/lesson/alcumus-types";
import { Button } from "@/components/ui/button";

type DeleteTarget =
  | { kind: "all" }
  | { kind: "one"; index: number; problem: AlcumusProblem };

export function AdminAlcumusPanel() {
  const { store, persist, saving } = useContentStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");
  const [seed, setSeed] = useState<AlcumusProblem[]>([]);
  const [problems, setProblems] = useState<AlcumusProblem[]>([]);
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
      const data = decodeAssessmentPayload<{ alcumus: AlcumusProblem[] }>(body.p);
      setSeed(data.alcumus);
    }
    loadSeed();
  }, []);

  useEffect(() => {
    const key = lessonKey(courseId, lessonId);
    setProblems(store.alcumusByLesson[key] ?? seed);
  }, [courseId, lessonId, store, seed]);

  function commit(next: AlcumusProblem[]) {
    setProblems(next);
    void persist({
      ...store,
      alcumusByLesson: {
        ...store.alcumusByLesson,
        [lessonKey(courseId, lessonId)]: next,
      },
    });
  }

  function updateProblem(id: string, patch: Partial<AlcumusProblem>) {
    commit(problems.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addProblem() {
    commit([
      ...problems,
      {
        id: `custom-${Date.now()}`,
        level: 1,
        type: "choice",
        prompt: "New problem",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
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
        : problems.filter((_, index) => index !== deleteTarget.index);

    setProblems(next);
    const ok = await persist({
      ...store,
      alcumusByLesson: {
        ...store.alcumusByLesson,
        [lessonKey(courseId, lessonId)]: next,
      },
    });
    if (!ok) return;
    closeDeleteDialog();
  }

  const deletePhrase =
    deleteTarget?.kind === "all"
      ? alcumusProblemsDeleteAllPhrase(lessonTitle)
      : deleteTarget?.kind === "one"
        ? alcumusProblemDeletePhrase(deleteTarget.index + 1)
        : "";

  const deleteTitle =
    deleteTarget?.kind === "all"
      ? `Delete all extra practice for ${lessonTitle}?`
      : deleteTarget?.kind === "one"
        ? `Delete extra practice problem ${deleteTarget.index + 1}?`
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600 dark:text-stone-400">
          {problems.length} extra practice problem{problems.length === 1 ? "" : "s"} for
          this lesson.
        </p>
        <div className="flex flex-wrap gap-2">
          {problems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
              onClick={() => openDeleteDialog({ kind: "all" })}
            >
              Delete all problems…
            </Button>
          )}
          <Button type="button" size="sm" onClick={addProblem}>
            Add problem
          </Button>
        </div>
      </div>

      <details className="rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-stone-50">
          Bulk import Alcumus questions (CSV)
        </summary>
        <div className="mt-4 border-t border-sky-100 pt-4 dark:border-stone-700">
          <AdminCsvImportBlock
            kind="alcumus"
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

      {problems.length === 0 ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
          No extra practice problems for this lesson yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {problems.map((problem, index) => (
            <li
              key={problem.id}
              className="space-y-3 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Problem {index + 1} · Level {problem.level} · {problem.type}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 border-red-300 px-2 text-xs text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                  onClick={() => openDeleteDialog({ kind: "one", index, problem })}
                >
                  Delete problem…
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="text-xs font-medium text-slate-500">
                  Level
                  <select
                    value={problem.level}
                    onChange={(e) =>
                      updateProblem(problem.id, {
                        level: Number(e.target.value) as AlcumusLevel,
                      })
                    }
                    className="mt-1 block rounded-md border border-sky-200 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-950"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Type
                  <select
                    value={problem.type}
                    onChange={(e) =>
                      updateProblem(problem.id, {
                        type: e.target.value as "choice" | "numeric",
                      })
                    }
                    className="mt-1 block rounded-md border border-sky-200 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-950"
                  >
                    <option value="choice">Multiple choice</option>
                    <option value="numeric">Numeric</option>
                  </select>
                </label>
              </div>

              <textarea
                value={problem.prompt}
                onChange={(e) => updateProblem(problem.id, { prompt: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
              />

              {problem.type === "choice" && (
                <div className="space-y-2">
                  {(problem.options ?? []).map((opt, optIndex) => (
                    <input
                      key={optIndex}
                      value={opt}
                      onChange={(e) => {
                        const options = [...(problem.options ?? [])];
                        options[optIndex] = e.target.value;
                        updateProblem(problem.id, { options });
                      }}
                      className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                    />
                  ))}
                  <label className="text-xs font-medium text-slate-500">
                    Correct index (0-based)
                    <input
                      type="number"
                      min={0}
                      value={problem.correctIndex ?? 0}
                      onChange={(e) =>
                        updateProblem(problem.id, {
                          correctIndex: Number(e.target.value),
                        })
                      }
                      className="mt-1 block w-24 rounded-md border border-sky-200 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-950"
                    />
                  </label>
                </div>
              )}

              {problem.type === "numeric" && (
                <input
                  value={(problem.acceptedAnswers ?? []).join(", ")}
                  onChange={(e) =>
                    updateProblem(problem.id, {
                      acceptedAnswers: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  placeholder="Accepted answers, comma-separated"
                  className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
                />
              )}

              <input
                value={problem.hint ?? ""}
                onChange={(e) => updateProblem(problem.id, { hint: e.target.value })}
                placeholder="Hint (optional)"
                className="w-full rounded-md border border-sky-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
              />
            </li>
          ))}
        </ul>
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
                This permanently removes all {problems.length} extra practice problem
                {problems.length === 1 ? "" : "s"} for <strong>{lessonTitle}</strong>.
                Students will see an empty extra practice section until new problems are
                added.
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
                This permanently removes extra practice problem {deleteTarget.index + 1}{" "}
                from <strong>{lessonTitle}</strong>. This cannot be undone.
              </p>
              <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-slate-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-300">
                {deleteTarget.problem.prompt}
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
          deleteTarget?.kind === "all" ? "Delete all problems" : "Delete problem"
        }
      />
    </div>
  );
}
