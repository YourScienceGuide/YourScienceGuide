import { lessonKey, slugifyId } from "@/lib/admin/lesson-key";
import type { AdminFlashcard } from "@/lib/lesson/admin-flashcard-types";
import type { Course } from "@/lib/student/curriculum-types";

export const FLASHCARD_CSV_HEADERS = ["Chapter", "Section", "Term"] as const;

export type ParsedFlashcardCsvRow = {
  rowNumber: number;
  chapter: number | null;
  section: number | null;
  term: string;
};

export type FlashcardCsvRowError = {
  rowNumber: number;
  message: string;
};

export type FlashcardCsvImportPreview = {
  rows: ParsedFlashcardCsvRow[];
  errors: FlashcardCsvRowError[];
  flashcardsByLessonKey: Record<string, AdminFlashcard[]>;
  importableCount: number;
};

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildFlashcardTemplateCsv(): string {
  return `${FLASHCARD_CSV_HEADERS.join(",")}\n`;
}

export function downloadFlashcardCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      continue;
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function findLessonId(
  course: Course,
  chapter: number | null,
  section: number | null,
  fallbackLessonId: string,
): string | null {
  if (chapter !== null && section !== null) {
    const match = course.lessons.find(
      (lesson) => lesson.chapter === chapter && lesson.section === section,
    );
    return match?.id ?? null;
  }
  return fallbackLessonId;
}

function uniqueCardId(term: string, rowNumber: number, index: number): string {
  const base = slugifyId(term) || "term";
  return `flashcard-${base}-${rowNumber}-${index}`;
}

export function parseFlashcardCsv(
  csvText: string,
  course: Course,
  fallbackLessonId: string,
): FlashcardCsvImportPreview {
  const rows: ParsedFlashcardCsvRow[] = [];
  const errors: FlashcardCsvRowError[] = [];
  const flashcardsByLessonKey: Record<string, AdminFlashcard[]> = {};

  const table = parseCsv(csvText.trim());
  if (table.length === 0) {
    return { rows, errors, flashcardsByLessonKey, importableCount: 0 };
  }

  const headers = table[0].map((cell) => cell.trim());
  const chapterIndex = headers.indexOf("Chapter");
  const sectionIndex = headers.indexOf("Section");
  const termIndex = headers.indexOf("Term");

  if (chapterIndex === -1 || sectionIndex === -1 || termIndex === -1) {
    errors.push({
      rowNumber: 1,
      message: 'Header row must include "Chapter", "Section", and "Term".',
    });
    return { rows, errors, flashcardsByLessonKey, importableCount: 0 };
  }

  const dataRows = table.slice(1);
  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    if (cells.every((cell) => !cell.trim())) return;

    const chapter = parsePositiveInt(cells[chapterIndex] ?? "");
    const section = parsePositiveInt(cells[sectionIndex] ?? "");
    const term = (cells[termIndex] ?? "").trim();

    if (!term) {
      errors.push({ rowNumber, message: "Term is required." });
      return;
    }

    const lessonId = findLessonId(course, chapter, section, fallbackLessonId);
    if (!lessonId) {
      errors.push({
        rowNumber,
        message: `No lesson found for Chapter ${chapter}, Section ${section}.`,
      });
      return;
    }

    const parsedRow: ParsedFlashcardCsvRow = { rowNumber, chapter, section, term };
    rows.push(parsedRow);

    const key = lessonKey(course.id, lessonId);
    const list = flashcardsByLessonKey[key] ?? [];
    list.push({
      id: uniqueCardId(term, rowNumber, list.length),
      term,
    });
    flashcardsByLessonKey[key] = list;
  });

  const importableCount = rows.length;
  return { rows, errors, flashcardsByLessonKey, importableCount };
}

export function serializeFlashcardExampleRow(): string {
  return ["3", "1", "Mitochondria"].map(escapeCsvField).join(",");
}

export function flashcardKindLabel(): string {
  return "Flashcards";
}
