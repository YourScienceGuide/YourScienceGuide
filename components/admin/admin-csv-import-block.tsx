"use client";

import { useMemo, useState } from "react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import {
  ALCUMUS_CSV_HEADERS,
  buildImportPreview,
  CHAPTER_CSV_HEADERS,
  downloadCsv,
  getCsvHeaders,
  kindLabel,
  serializeExampleRow,
  type CsvImportKind,
} from "@/lib/admin/csv-questions";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";
import { getCourseFromStore } from "@/lib/admin/content-store";
import { Button } from "@/components/ui/button";

type AdminCsvImportBlockProps = {
  kind: CsvImportKind;
  courseId: string;
  lessonId: string;
  onCourseChange: (courseId: string) => void;
  onLessonChange: (lessonId: string) => void;
  showLessonPicker?: boolean;
  onImported?: () => void;
};

function FormatTable({ kind }: { kind: CsvImportKind }) {
  const headers = kind === "alcumus" ? ALCUMUS_CSV_HEADERS : CHAPTER_CSV_HEADERS;

  return (
    <div className="overflow-x-auto rounded-md border border-sky-100 bg-sky-50/50 dark:border-stone-700 dark:bg-stone-950">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-sky-200 dark:border-stone-700">
            {headers.map((header) => (
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
            <td className="max-w-xs px-3 py-2">Question text…</td>
            <td className="px-3 py-2">A</td>
            <td className="px-3 py-2">B</td>
            <td className="px-3 py-2 text-slate-400">(optional)</td>
            <td className="px-3 py-2 text-slate-400">(optional)</td>
            <td className="px-3 py-2">2</td>
            <td className="px-3 py-2">—</td>
            {kind === "alcumus" ? (
              <>
                <td className="px-3 py-2">Hint…</td>
                <td className="px-3 py-2">1</td>
              </>
            ) : (
              <td className="px-3 py-2">40</td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function AdminCsvImportBlock({
  kind,
  courseId,
  lessonId,
  onCourseChange,
  onLessonChange,
  showLessonPicker = true,
  onImported,
}: AdminCsvImportBlockProps) {
  const { store, persist, saveError } = useContentStore();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const course = getCourseFromStore(store, courseId);
  const preview = useMemo(() => {
    if (!csvText || !course || !lessonId) return null;
    return buildImportPreview(csvText, kind, course, lessonId);
  }, [csvText, course, kind, lessonId]);

  const lessonBuckets =
    preview?.kind === "alcumus"
      ? preview.alcumusByLessonKey
      : preview?.chapterQuestionsByLessonKey;

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
      alcumusByLesson: { ...store.alcumusByLesson },
      lessonQuestions: { ...store.lessonQuestions },
    };

    if (preview.kind === "alcumus") {
      for (const [key, imported] of Object.entries(preview.alcumusByLessonKey)) {
        nextStore.alcumusByLesson[key] = [
          ...(nextStore.alcumusByLesson[key] ?? []),
          ...imported,
        ];
      }
    } else {
      for (const [key, imported] of Object.entries(preview.chapterQuestionsByLessonKey)) {
        nextStore.lessonQuestions[key] = [
          ...(nextStore.lessonQuestions[key] ?? []),
          ...imported,
        ];
      }
    }

    const ok = await persist(nextStore);
    if (!ok) return;

    setImportMessage(
      `Imported ${preview.importableCount} ${kindLabel(preview.kind).toLowerCase()} question${preview.importableCount === 1 ? "" : "s"}.`,
    );
    setCsvText(null);
    setFileName(null);
    onImported?.();
  }

  const templateName =
    kind === "alcumus" ? "ysg-alcumus-template.xlsx" : "ysg-end-of-chapter-template.xlsx";
  const exampleName =
    kind === "alcumus" ? "ysg-alcumus-examples.csv" : "ysg-end-of-chapter-examples.csv";

  async function handleDownloadTemplate() {
    const response = await fetch(`/api/admin/question-template?kind=${kind}`);
    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = templateName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <FormatTable kind={kind} />

      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-stone-400">
        <li>
          <strong className="font-medium text-slate-800 dark:text-stone-200">Type</strong>{" "}
          is a dropdown in the Excel template (
          <code className="text-xs">multiple-choice</code> or{" "}
          <code className="text-xs">free-response</code>).
        </li>
        <li>
          <strong className="font-medium text-slate-800 dark:text-stone-200">
            multiple-choice
          </strong>{" "}
          rows need at least two options (Option 1 and Option 2). Options 3 and 4
          are optional. Leave unused option columns blank and set Correct to the
          option number (Option 1 = 1).
        </li>
        <li>
          <strong className="font-medium text-slate-800 dark:text-stone-200">
            free-response
          </strong>{" "}
          {kind === "alcumus"
            ? "rows need Accepted Answers."
            : "rows need Accepted Answers and/or Min Length."}
        </li>
        <li>
          Chapter and Section route rows to matching lessons. Leave both blank to use
          the fallback lesson{showLessonPicker ? " below" : " selected above"}.
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button type="button" size="sm" onClick={handleDownloadTemplate}>
          Download blank template (.xlsx)
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            downloadCsv(
              exampleName,
              `${getCsvHeaders(kind).join(",")}\n${serializeExampleRow(kind, "multiple-choice")}\n${serializeExampleRow(kind, "free-response")}\n`,
            )
          }
        >
          Download example rows
        </Button>
      </div>

      {showLessonPicker && (
        <>
          <AdminLessonPicker
            store={store}
            courseId={courseId}
            lessonId={lessonId}
            onCourseChange={onCourseChange}
            onLessonChange={onLessonChange}
          />
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Fallback lesson when Chapter and Section are blank. Imported questions
            append to existing questions for each lesson.
          </p>
        </>
      )}

      <p className="text-sm text-slate-600 dark:text-stone-400">
        After filling in the template, save the workbook as CSV before uploading
        below.
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-stone-300">
          {kindLabel(kind)} CSV file
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
            {preview.importableCount} question{preview.importableCount === 1 ? "" : "s"}{" "}
            ready to import
            {Object.keys(lessonBuckets ?? {}).length > 0 &&
              ` across ${Object.keys(lessonBuckets ?? {}).length} lesson${Object.keys(lessonBuckets ?? {}).length === 1 ? "" : "s"}`}
            .
          </p>

          {lessonBuckets && Object.entries(lessonBuckets).length > 0 && (
            <ul className="space-y-1 text-sm text-slate-600 dark:text-stone-400">
              {Object.entries(lessonBuckets).map(([key, questions]) => {
                const typedQuestions = questions as Array<AlcumusProblem | LessonQuestion>;
                const [, targetLessonId] = key.split("/");
                const lesson = course?.lessons.find((l) => l.id === targetLessonId);
                return (
                  <li key={key}>
                    {lesson?.title ?? targetLessonId}: {typedQuestions.length} question
                    {typedQuestions.length === 1 ? "" : "s"}
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
            disabled={preview.importableCount === 0}
            onClick={handleImport}
          >
            Import {preview.importableCount} question{preview.importableCount === 1 ? "" : "s"}
          </Button>
        </div>
      )}

      {importMessage && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">{importMessage}</p>
      )}
      {saveError && (
        <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
      )}
    </div>
  );
}
