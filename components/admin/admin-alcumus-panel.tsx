"use client";

import { useEffect, useState } from "react";

import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import { lessonKey } from "@/lib/admin/lesson-key";
import { decodeAssessmentPayload } from "@/lib/ai-guard/encode";
import type { AlcumusLevel, AlcumusProblem } from "@/lib/lesson/alcumus-types";
import { Button } from "@/components/ui/button";

export function AdminAlcumusPanel() {
  const { store, persist } = useContentStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");
  const [seed, setSeed] = useState<AlcumusProblem[]>([]);
  const [problems, setProblems] = useState<AlcumusProblem[]>([]);

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
          {problems.length} problem(s). Changes apply to this lesson in this browser.
        </p>
        <Button type="button" size="sm" onClick={addProblem}>
          Add problem
        </Button>
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

      <ul className="space-y-4">
        {problems.map((problem) => (
          <li
            key={problem.id}
            className="space-y-3 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
          >
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
                {(problem.options ?? []).map((opt, index) => (
                  <input
                    key={index}
                    value={opt}
                    onChange={(e) => {
                      const options = [...(problem.options ?? [])];
                      options[index] = e.target.value;
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => commit(problems.filter((p) => p.id !== problem.id))}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
