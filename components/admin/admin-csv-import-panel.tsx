"use client";

import { useState, type KeyboardEvent } from "react";

import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { AdminCsvImportScopeCallout } from "@/components/admin/admin-csv-import-scope-callout";
import { AdminFlashcardCsvImportBlock } from "@/components/admin/admin-flashcard-csv-import-block";
import { AdminReviewCsvImportBlock } from "@/components/admin/admin-review-csv-import-block";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import { cn } from "@/lib/utils";

type ImportTarget = "chapter" | "review" | "flashcards";

const IMPORT_TARGETS: Array<{
  id: ImportTarget;
  label: string;
  description: string;
}> = [
  {
    id: "chapter",
    label: "Chapter question bank",
    description: "Assignment and practice questions for any lesson",
  },
  {
    id: "review",
    label: "Review questions",
    description: "Warm-ups that unlock the lesson video",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description: "Terms students define during review",
  },
];

export function AdminCsvImportPanel() {
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const [target, setTarget] = useState<ImportTarget>("chapter");

  function onTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = IMPORT_TARGETS.findIndex((option) => option.id === target);
    if (index < 0) return;

    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % IMPORT_TARGETS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + IMPORT_TARGETS.length) % IMPORT_TARGETS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = IMPORT_TARGETS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const next = IMPORT_TARGETS[nextIndex];
    setTarget(next.id);
    window.requestAnimationFrame(() => {
      document.getElementById(`import-tab-${next.id}`)?.focus();
    });
  }

  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            Bulk import
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-stone-400">
            Choose what you want to import, then upload a CSV. Each row can target a
            different lesson with Chapter and Section.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Import type"
          className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3"
          onKeyDown={onTabListKeyDown}
        >
          {IMPORT_TARGETS.map((option) => {
            const selected = target === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                id={`import-tab-${option.id}`}
                aria-selected={selected}
                aria-controls={`import-panel-${option.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTarget(option.id)}
                className={cn(
                  "rounded-xl border px-4 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  selected
                    ? "border-sky-600 bg-sky-600 text-white shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                    : "border-sky-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800",
                )}
              >
                <span className="block text-sm font-semibold leading-snug">
                  {option.label}
                </span>
                <span
                  className={cn(
                    "mt-1.5 block text-xs leading-snug",
                    selected
                      ? "text-sky-50 dark:text-stone-600"
                      : "text-slate-500 dark:text-stone-500",
                  )}
                >
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-left">
          <AdminCsvImportScopeCallout />
        </div>
      </section>

      <section
        id={`import-panel-${target}`}
        role="tabpanel"
        aria-labelledby={`import-tab-${target}`}
        className="mx-auto max-w-4xl space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
      >
        {target === "chapter" && (
          <>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
                Chapter question bank
              </h3>
              <p className="text-sm text-slate-600 dark:text-stone-400">
                Import questions for any lesson in the course. Set{" "}
                <strong>Level</strong> to 1–2 for easier problems (eligible for the
                required assignment) or 3–5 for harder extra-practice-only problems.
              </p>
            </div>
            <AdminCsvImportBlock
              kind="chapter"
              courseId={courseId}
              lessonId={lessonId}
              onCourseChange={setCourseId}
              onLessonChange={setLessonId}
              showScopeCallout={false}
            />
          </>
        )}

        {target === "review" && (
          <>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
                Review questions
              </h3>
              <p className="text-sm text-slate-600 dark:text-stone-400">
                Warm-up questions shown before readings and the lesson video. Students
                must complete them to unlock the rest of the lesson. One file can fill
                review questions for many lessons.
              </p>
            </div>
            <AdminReviewCsvImportBlock
              courseId={courseId}
              lessonId={lessonId}
              onCourseChange={setCourseId}
              onLessonChange={setLessonId}
              showScopeCallout={false}
            />
          </>
        )}

        {target === "flashcards" && (
          <>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
                Flashcards
              </h3>
              <p className="text-sm text-slate-600 dark:text-stone-400">
                Import flashcard <strong>terms</strong> for any lesson. Students write
                their own definitions during review.
              </p>
            </div>
            <AdminFlashcardCsvImportBlock
              courseId={courseId}
              lessonId={lessonId}
              onCourseChange={setCourseId}
              onLessonChange={setLessonId}
              showScopeCallout={false}
            />
          </>
        )}
      </section>
    </div>
  );
}
