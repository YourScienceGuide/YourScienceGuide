"use client";

import { useMemo, useState } from "react";

import { AdminCsvImportRoutingSettings } from "@/components/admin/admin-csv-import-routing-settings";
import { AdminCsvImportScopeCallout } from "@/components/admin/admin-csv-import-scope-callout";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { useContentStore } from "@/components/admin/content-store-provider";
import { questionTemplateFilename } from "@/lib/admin/csv-template";
import {
  formatCsvImportPreviewSummary,
  formatCsvImportResultMessage,
} from "@/lib/admin/csv-import-dedupe";
import {
  REVIEW_QUESTION_CSV_HEADERS,
  buildReviewImportPreview,
  buildReviewTemplateCsv,
  downloadReviewCsv,
} from "@/lib/admin/csv-review-questions";
import { serializeExampleRow } from "@/lib/admin/csv-questions";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { Button } from "@/components/ui/button";

type AdminReviewCsvImportBlockProps = {
  courseId: string;
  lessonId: string;
  onCourseChange: (courseId: string) => void;
  onLessonChange: (lessonId: string) => void;
  showScopeCallout?: boolean;
};

export function AdminReviewCsvImportBlock({
  courseId,
  lessonId,
  onCourseChange,
  onLessonChange,
  showScopeCallout = true,
}: AdminReviewCsvImportBlockProps) {
  const { store, persist, saving, actionFeedback, clearActionFeedback } =
    useContentStore();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const course = getCourseFromStore(store, courseId);
  const preview = useMemo(() => {
    if (!csvText || !course || !lessonId) return null;
    return buildReviewImportPreview(
      csvText,
      course,
      lessonId,
      store.reviewQuestionsByLesson ?? {},
    );
  }, [csvText, course, lessonId, store.reviewQuestionsByLesson]);

  function handleFileChange(file: File | null) {
    setImportMessage(null);
    if (!file) {
      setCsvText(null);
      setFileName(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setFileName(file.name);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview || preview.importableCount === 0) return;

    const nextStore = {
      ...store,
      reviewQuestionsByLesson: { ...(store.reviewQuestionsByLesson ?? {}) },
    };

    for (const [key, imported] of Object.entries(preview.reviewQuestionsByLessonKey)) {
      nextStore.reviewQuestionsByLesson![key] = [
        ...(nextStore.reviewQuestionsByLesson![key] ?? []),
        ...imported,
      ];
    }

    const message = formatCsvImportResultMessage(
      preview.importableCount,
      preview.skippedDuplicateCount,
      "review question",
      "review questions",
    );
    const result = await persist(nextStore, { successMessage: message });
    if (!result.ok) return;

    setImportMessage(message);
    setCsvText(null);
    setFileName(null);
  }

  async function handleDownloadTemplate() {
    const response = await fetch("/api/admin/question-template?kind=review");
    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = questionTemplateFilename("review");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <AdminActionFeedback
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />
      {showScopeCallout && <AdminCsvImportScopeCallout />}

      <div className="overflow-x-auto rounded-md border border-sky-100 bg-sky-50/50 dark:border-stone-700 dark:bg-stone-950">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sky-200 dark:border-stone-700">
              {REVIEW_QUESTION_CSV_HEADERS.map((header) => (
                <th
                  key={header}
                  className="px-3 py-2 font-medium text-slate-700 dark:text-stone-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-slate-600 dark:text-stone-400">
              <td className="px-3 py-2">3</td>
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2">multiple-choice</td>
              <td className="max-w-xs px-3 py-2">Review question text…</td>
              <td className="px-3 py-2">A</td>
              <td className="px-3 py-2">B</td>
              <td className="px-3 py-2 text-slate-400">(optional)</td>
              <td className="px-3 py-2 text-slate-400">(optional)</td>
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">40</td>
              <td className="px-3 py-2">Hint…</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-stone-400">
        <li>
          Review questions warm students up before readings and the lesson video. The{" "}
          <strong className="font-medium text-slate-800 dark:text-stone-200">Level</strong>{" "}
          column is not used — omit it or leave it blank.
        </li>
        <li>
          Chapter and Section on each row route to matching lessons in the course.
          Leave both blank only when you want that row to use the fallback lesson in
          Routing settings.
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button type="button" size="sm" onClick={() => void handleDownloadTemplate()}>
          Download blank template (.csv)
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            downloadReviewCsv(
              "ysg-review-questions-examples.csv",
              `${buildReviewTemplateCsv().trim()}\n${serializeExampleRow("chapter", "multiple-choice").replace(/,2$/, "")}\n`,
            );
          }}
        >
          Download example row
        </Button>
      </div>

      <AdminCsvImportRoutingSettings
        store={store}
        courseId={courseId}
        lessonId={lessonId}
        onCourseChange={onCourseChange}
        onLessonChange={onLessonChange}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-stone-300">
          Upload filled review questions CSV
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {fileName && <p className="text-xs text-slate-500">Loaded: {fileName}</p>}
      </div>

      {preview && (
        <div className="space-y-3 rounded-md border border-sky-100 bg-sky-50/40 p-4 dark:border-stone-700 dark:bg-stone-950">
          <p className="text-sm text-slate-700 dark:text-stone-300">
            {formatCsvImportPreviewSummary(
              preview.importableCount,
              preview.skippedDuplicateCount,
              "question",
            )}
            {Object.keys(preview.reviewQuestionsByLessonKey).length > 0 &&
              ` across ${Object.keys(preview.reviewQuestionsByLessonKey).length} lesson${Object.keys(preview.reviewQuestionsByLessonKey).length === 1 ? "" : "s"}`}
            .
          </p>

          {Object.entries(preview.reviewQuestionsByLessonKey).length > 0 && (
            <ul className="space-y-1 text-sm text-slate-600 dark:text-stone-400">
              {Object.entries(preview.reviewQuestionsByLessonKey).map(([key, questions]) => {
                const [, targetLessonId] = key.split("/");
                const lesson = course?.lessons.find((entry) => entry.id === targetLessonId);
                return (
                  <li key={key}>
                    {lesson?.title ?? targetLessonId}: {questions.length} question
                    {questions.length === 1 ? "" : "s"}
                  </li>
                );
              })}
            </ul>
          )}

          {preview.errors.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-red-700 dark:text-red-300">
              {preview.errors.map((error) => (
                <li key={`${error.rowNumber}-${error.message}`}>
                  {error.rowNumber > 0 ? `Row ${error.rowNumber}: ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            size="sm"
            disabled={preview.importableCount === 0 || saving}
            onClick={() => void handleImport()}
          >
            {saving
              ? "Saving…"
              : `Import ${preview.importableCount} question${preview.importableCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}

      {importMessage && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">{importMessage}</p>
      )}
    </div>
  );
}
