"use client";

import { useState } from "react";

import { AdminCsvImportBlock } from "@/components/admin/admin-csv-import-block";
import { useContentStore } from "@/components/admin/content-store-provider";

export function AdminCsvImportPanel() {
  const { store } = useContentStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Chapter question bank
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Import questions for a lesson in one file. Set <strong>Level</strong> to 1–2 for
          easier problems (eligible for the required assignment) or 3–5 for harder extra
          practice-only problems. Up to four level 1–2 questions are chosen at random per
          student for the assignment; the rest flow to extra practice.
        </p>
        <AdminCsvImportBlock
          kind="chapter"
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
