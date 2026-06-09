"use client";

import { useEffect, useState } from "react";

import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/use-content-store";
import { lessonKey } from "@/lib/admin/lesson-key";
import { saveContentStore } from "@/lib/admin/content-store";
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

export function AdminAssignmentPanel() {
  const { store, persist } = useContentStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");
  const [seed, setSeed] = useState<LessonQuestion[]>(SEED_TEMPLATE);
  const [questions, setQuestions] = useState<LessonQuestion[]>(SEED_TEMPLATE);

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
    const updated = {
      ...store,
      lessonQuestions: {
        ...store.lessonQuestions,
        [lessonKey(courseId, lessonId)]: next,
      },
    };
    saveContentStore(updated);
    persist(updated);
  }

  function updateQ(index: number, patch: Partial<LessonQuestion>) {
    const next = questions.map((q, i) =>
      i === index ? ({ ...q, ...patch } as LessonQuestion) : q,
    );
    commit(next);
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

      <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
        {questions.length} question{questions.length === 1 ? "" : "s"} for this lesson
      </p>

      <ol className="space-y-6">
        {questions.map((q, index) => (
          <li
            key={q.id}
            className="space-y-3 rounded-lg border border-sky-200 p-4 dark:border-stone-700"
          >
            <p className="text-xs font-medium uppercase text-slate-500">{q.type}</p>
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
          </li>
        ))}
      </ol>

      <Button type="button" size="sm" onClick={() => commit(seed)}>
        Reset to API defaults for this lesson
      </Button>
    </div>
  );
}
