"use client";

import { useMemo, useState } from "react";

import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/use-content-store";
import {
  ALCUMUS_CSV_HEADERS,
  buildImportPreview,
  buildTemplateCsv,
  CHAPTER_CSV_HEADERS,
  downloadCsv,
  getCsvHeaders,
  kindLabel,
  serializeExampleRow,
  type CsvImportKind,
} from "@/lib/admin/csv-questions";
import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";
import { getCourseFromStore, saveContentStore } from "@/lib/admin/content-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const IMPORT_KINDS: { id: CsvImportKind; label: string; description: string }[] = [
  {
    id: "alcumus",
    label: "Extra practice (Alcumus)",
    description:
      "Optional practice problems students can revisit. Supports multiple-choice and free-response (numeric) rows.",
  },
  {
    id: "end-of-chapter",
    label: "End-of-chapter",
    description:
      "Assignment-style questions for a lesson. Supports multiple-choice, short-answer, and long-answer rows.",
  },
];

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
            <td className="px-3 py-2">C</td>
            <td className="px-3 py-2">D</td>
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

export function AdminCsvImportPanel() {
  const { store, persist } = useContentStore();
  const [importKind, setImportKind] = useState<CsvImportKind>("alcumus");
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(store.courses[0]?.lessons[0]?.id ?? "");
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const course = getCourseFromStore(store, courseId);
  const preview = useMemo(() => {
    if (!csvText || !course || !lessonId) return null;
    return buildImportPreview(csvText, importKind, course, lessonId);
  }, [csvText, course, importKind, lessonId]);

  const lessonBuckets =
    preview?.kind === "alcumus"
      ? preview.alcumusByLessonKey
      : preview?.chapterQuestionsByLessonKey;

  function resetFile() {
    setCsvText(null);
    setFileName(null);
    setImportMessage(null);
  }

  function handleKindChange(kind: CsvImportKind) {
    setImportKind(kind);
    resetFile();
  }

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

  function handleImport() {
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

    saveContentStore(nextStore);
    persist(nextStore);
    setImportMessage(
      `Imported ${preview.importableCount} ${kindLabel(preview.kind).toLowerCase()} question${preview.importableCount === 1 ? "" : "s"} into ${Object.keys(lessonBuckets ?? {}).length} lesson${Object.keys(lessonBuckets ?? {}).length === 1 ? "" : "s"}.`,
    );
    setCsvText(null);
    setFileName(null);
  }

  const selectedKind = IMPORT_KINDS.find((item) => item.id === importKind)!;

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Question type
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {IMPORT_KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleKindChange(item.id)}
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
          {selectedKind.label} CSV format
        </h2>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Download the template for this question bank, fill it in Excel or Google
          Sheets, then upload the CSV below. Each file is for one bank only — use a
          separate CSV for Alcumus vs end-of-chapter questions.
        </p>

        <FormatTable kind={importKind} />

        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-stone-400">
          <li>
            <strong className="font-medium text-slate-800 dark:text-stone-200">Type</strong>{" "}
            must be <code className="text-xs">multiple-choice</code> or{" "}
            <code className="text-xs">free-response</code> on every row.
          </li>
          <li>
            <strong className="font-medium text-slate-800 dark:text-stone-200">
              multiple-choice
            </strong>{" "}
            rows need all four options and Correct (1–4).
          </li>
          <li>
            <strong className="font-medium text-slate-800 dark:text-stone-200">
              free-response
            </strong>{" "}
            {importKind === "alcumus"
              ? "rows need Accepted Answers (semicolon- or comma-separated)."
              : "rows need Accepted Answers and/or Min Length (characters for long-answer)."}
          </li>
          <li>
            <strong className="font-medium text-slate-800 dark:text-stone-200">
              Chapter
            </strong>{" "}
            and{" "}
            <strong className="font-medium text-slate-800 dark:text-stone-200">
              Section
            </strong>{" "}
            route rows to lessons with matching numbers in Curriculum. Leave both blank
            to use the fallback lesson below.
          </li>
          {importKind === "alcumus" && (
            <li>
              Optional <code className="text-xs">Hint</code> and{" "}
              <code className="text-xs">Level</code> (1–5, default 1).
            </li>
          )}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              downloadCsv(
                importKind === "alcumus"
                  ? "ysg-alcumus-template.csv"
                  : "ysg-end-of-chapter-template.csv",
                buildTemplateCsv(importKind),
              )
            }
          >
            Download blank {importKind === "alcumus" ? "Alcumus" : "end-of-chapter"} template
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsv(
                importKind === "alcumus"
                  ? "ysg-alcumus-examples.csv"
                  : "ysg-end-of-chapter-examples.csv",
                `${getCsvHeaders(importKind).join(",")}\n${serializeExampleRow(importKind, "multiple-choice")}\n${serializeExampleRow(importKind, "free-response")}\n`,
              )
            }
          >
            Download example rows
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          Import {selectedKind.label} CSV
        </h2>

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
          Fallback lesson when Chapter and Section are blank. Imported questions append
          to existing {importKind === "alcumus" ? "Alcumus" : "assignment"} questions
          for each lesson.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-stone-300">
            {selectedKind.label} CSV file
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
              {preview.rows.length > preview.importableCount &&
                ` ${preview.rows.length - preview.importableCount} row(s) have errors.`}
            </p>

            {lessonBuckets && Object.entries(lessonBuckets).length > 0 && (
              <ul className="space-y-1 text-sm text-slate-600 dark:text-stone-400">
                {Object.entries(lessonBuckets).map(([key, questions]) => {
                  const typedQuestions = questions as Array<AlcumusProblem | LessonQuestion>;
                  const [, targetLessonId] = key.split("/");
                  const lesson = course?.lessons.find((l) => l.id === targetLessonId);
                  const mcCount = typedQuestions.filter((q) => {
                    return q.type === "multiple-choice" || q.type === "choice";
                  }).length;
                  const frCount = typedQuestions.length - mcCount;
                  return (
                    <li key={key}>
                      {lesson?.title ?? targetLessonId}: {typedQuestions.length} question
                      {typedQuestions.length === 1 ? "" : "s"} ({mcCount} multiple-choice,{" "}
                      {frCount} free-response)
                    </li>
                  );
                })}
              </ul>
            )}

            {preview.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Issues</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-red-700 dark:text-red-300">
                  {preview.errors.map((error) => (
                    <li key={`${error.rowNumber}-${error.message}`}>
                      {error.rowNumber > 0 ? `Row ${error.rowNumber}: ` : ""}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
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
      </section>
    </div>
  );
}
