"use client";

import { useState } from "react";

import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { useContentStore } from "@/components/admin/use-content-store";
import type { CsvImportKind } from "@/lib/admin/csv-questions";
import { cn } from "@/lib/utils";

const IMPORT_KINDS: { id: CsvImportKind; label: string; description: string }[] = [
  {
    id: "end-of-chapter",
    label: "End-of-chapter (assignment)",
    description:
      "Required lesson assignment questions — multiple-choice, short-answer, and long-answer.",
  },
  {
    id: "alcumus",
    label: "Extra practice (Alcumus)",
    description:
      "Optional practice problems — multiple-choice and free-response (numeric).",
  },
];

export function AdminCsvImportPanel() {
  const { store } = useContentStore();
  const [importKind, setImportKind] = useState<CsvImportKind>("end-of-chapter");
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");

  const selectedKind = IMPORT_KINDS.find((item) => item.id === importKind)!;

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          What are you importing?
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          End-of-chapter and Alcumus use different CSV templates. Pick the bank that
          matches your file before downloading a template or uploading.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {IMPORT_KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setImportKind(item.id)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                importKind === item.id
                  ? "border-sky-500 bg-sky-50 dark:border-stone-300 dark:bg-stone-800"
                  : "border-sky-200 hover:bg-sky-50/60 dark:border-stone-700 dark:hover:bg-stone-900",
              )}
            >
              <p className="font-medium text-slate-900 dark:text-stone-50">{item.label}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          {selectedKind.label}
        </h2>
        <AdminCsvImportBlock
          kind={importKind}
          courseId={courseId}
          lessonId={lessonId}
          onCourseChange={(id) => {
            setCourseId(id);
            const first = store.courses.find((c) => c.id === id)?.lessons[0]?.id;
            if (first) setLessonId(first);
          }}
          onLessonChange={setLessonId}
        />
      </section>
    </div>
  );
}
