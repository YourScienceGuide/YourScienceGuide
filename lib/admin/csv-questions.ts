import { lessonKey } from "@/lib/admin/lesson-key";
import { filterNewChapterQuestionsByLesson } from "@/lib/admin/csv-import-dedupe";
import { countBlanks } from "@/lib/lesson/fill-in-blank";
import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import type { Course } from "@/lib/student/curriculum-types";

export type CsvImportKind = "chapter" | "end-of-chapter" | "alcumus";

export const CHAPTER_QUESTION_CSV_HEADERS = [
  "Chapter",
  "Section",
  "Type",
  "Question",
  "Option 1",
  "Option 2",
  "Option 3",
  "Option 4",
  "Correct",
  "Accepted Answers",
  "Min Length",
  "Hint",
  "Level",
] as const;

/** @deprecated Use CHAPTER_QUESTION_CSV_HEADERS */
export const ALCUMUS_CSV_HEADERS = CHAPTER_QUESTION_CSV_HEADERS;

/** @deprecated Use CHAPTER_QUESTION_CSV_HEADERS */
export const CHAPTER_CSV_HEADERS = CHAPTER_QUESTION_CSV_HEADERS;

export type CsvRowType = "multiple-choice" | "free-response" | "fill-in-the-blank";

export type ParsedCsvRow = {
  rowNumber: number;
  chapter: number | null;
  section: number | null;
  type: CsvRowType;
  question: string;
  options: string[];
  correct: number | null;
  acceptedAnswers: string[];
  blankAnswers: string[][];
  hint?: string;
  level?: AlcumusLevel;
  minLength?: number;
};

export type CsvRowError = {
  rowNumber: number;
  message: string;
};

export type CsvImportPreview = {
  kind: CsvImportKind;
  rows: ParsedCsvRow[];
  errors: CsvRowError[];
  questionBankByLessonKey: Record<string, ChapterQuestion[]>;
  /** @deprecated Use questionBankByLessonKey */
  alcumusByLessonKey: Record<string, never>;
  /** @deprecated Use questionBankByLessonKey */
  chapterQuestionsByLessonKey: Record<string, never>;
  importableCount: number;
  skippedDuplicateCount: number;
};

function normalizeImportKind(kind: CsvImportKind): "chapter" | "legacy-end" | "legacy-alcumus" {
  if (kind === "alcumus") return "legacy-alcumus";
  if (kind === "end-of-chapter") return "legacy-end";
  return "chapter";
}

export function getCsvHeaders(_kind: CsvImportKind = "chapter"): readonly string[] {
  return CHAPTER_QUESTION_CSV_HEADERS;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildTemplateCsv(kind: CsvImportKind): string {
  return `${getCsvHeaders(kind).join(",")}\n`;
}

export function downloadCsv(filename: string, content: string) {
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
    } else if (char === "\r" && next === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
    } else if (char === "\n" || char === "\r") {
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

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function headerIndex(headers: string[], ...names: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const name of names) {
    const index = normalized.indexOf(normalizeHeader(name));
    if (index >= 0) return index;
  }
  return -1;
}

function readRecord(headers: string[], cells: string[]): Record<string, string> {
  const names = [
    "Chapter",
    "Section",
    "Type",
    "Question",
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Correct",
    "Accepted Answers",
    "Hint",
    "Level",
    "Min Length",
  ];
  const record: Record<string, string> = {};
  for (const name of names) {
    const index = headerIndex(headers, name);
    record[name] = index >= 0 ? (cells[index] ?? "").trim() : "";
  }
  return record;
}

function parseRowType(raw: string): CsvRowType | null {
  const normalized = normalizeHeader(raw).replace(/_/g, "-");
  if (
    normalized === "multiple-choice" ||
    normalized === "multiple choice" ||
    normalized === "mc" ||
    normalized === "choice"
  ) {
    return "multiple-choice";
  }
  if (
    normalized === "free-response" ||
    normalized === "free response" ||
    normalized === "free" ||
    normalized === "short-answer" ||
    normalized === "short answer" ||
    normalized === "numeric"
  ) {
    return "free-response";
  }
  if (
    normalized === "fill-in-the-blank" ||
    normalized === "fill in the blank" ||
    normalized === "fill-in-blank" ||
    normalized === "fill in blank" ||
    normalized === "fib" ||
    normalized === "blank"
  ) {
    return "fill-in-the-blank";
  }
  return null;
}

function parseAcceptedAnswers(raw: string): string[] {
  return raw
    .split(/[|;]/)
    .flatMap((part) => part.split(","))
    .map((answer) => answer.trim())
    .filter(Boolean);
}

const MIN_MULTIPLE_CHOICE_OPTIONS = 2;
const MAX_MULTIPLE_CHOICE_OPTIONS = 4;

function parseMultipleChoiceOptions(
  record: Record<string, string>,
): { options?: string[]; error?: string } {
  const raw = [
    record["Option 1"]?.trim() ?? "",
    record["Option 2"]?.trim() ?? "",
    record["Option 3"]?.trim() ?? "",
    record["Option 4"]?.trim() ?? "",
  ];

  let sawEmpty = false;
  const options: string[] = [];

  for (const option of raw) {
    if (option) {
      if (sawEmpty) {
        return {
          error:
            "Multiple-choice options must be filled in order starting with Option 1 (no skipped columns).",
        };
      }
      options.push(option);
    } else {
      sawEmpty = true;
    }
  }

  if (options.length < MIN_MULTIPLE_CHOICE_OPTIONS) {
    return {
      error:
        "Multiple-choice rows need at least two options (for example, True and False).",
    };
  }

  if (options.length > MAX_MULTIPLE_CHOICE_OPTIONS) {
    return {
      error: `Multiple-choice rows support up to ${MAX_MULTIPLE_CHOICE_OPTIONS} options.`,
    };
  }

  return { options };
}

function parseFillInBlankAnswers(
  raw: string,
  blankCount: number,
): { blankAnswers?: string[][]; error?: string } {
  const parts = raw
    .split(/[|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== blankCount) {
    return {
      error: `Fill-in-the-blank rows need ${blankCount} accepted answer group(s) in Accepted Answers (one per blank, separated by |).`,
    };
  }

  const blankAnswers = parts.map((part) =>
    part
      .split(",")
      .map((answer) => answer.trim())
      .filter(Boolean),
  );

  if (blankAnswers.some((answers) => answers.length === 0)) {
    return {
      error: "Each blank needs at least one accepted answer (comma-separate spelling variants).",
    };
  }

  return { blankAnswers };
}

function validateRow(
  rowNumber: number,
  record: Record<string, string>,
  kind: CsvImportKind,
): { row?: ParsedCsvRow; error?: CsvRowError } {
  const importKind = normalizeImportKind(kind);
  const question = record.Question?.trim() ?? "";
  if (!question) {
    return { error: { rowNumber, message: "Question is required." } };
  }

  const type = parseRowType(record.Type ?? "");
  if (!type) {
    return {
      error: {
        rowNumber,
        message:
          'Type must be "multiple-choice", "free-response", or "fill-in-the-blank".',
      },
    };
  }

  if (type === "fill-in-the-blank" && importKind === "legacy-alcumus") {
    return {
      error: {
        rowNumber,
        message: "Fill-in-the-blank is not supported in legacy Alcumus CSV imports.",
      },
    };
  }

  const chapter = parseOptionalNumber(record.Chapter ?? "");
  const section = parseOptionalNumber(record.Section ?? "");
  if ((record.Chapter ?? "").trim() && chapter === null) {
    return { error: { rowNumber, message: "Chapter must be a number when provided." } };
  }
  if ((record.Section ?? "").trim() && section === null) {
    return { error: { rowNumber, message: "Section must be a number when provided." } };
  }

  const optionsResult = parseMultipleChoiceOptions(record);
  const acceptedAnswers = parseAcceptedAnswers(record["Accepted Answers"] ?? "");
  const minLength = parseOptionalNumber(record["Min Length"] ?? "");
  let correct: number | null = null;
  let options: string[] = [];
  let blankAnswers: string[][] = [];

  if (type === "fill-in-the-blank") {
    const blankCount = countBlanks(question);
    if (blankCount === 0) {
      return {
        error: {
          rowNumber,
          message:
            'Fill-in-the-blank questions must include at least one blank marked with ________ (four or more underscores).',
        },
      };
    }

    const parsedBlanks = parseFillInBlankAnswers(
      record["Accepted Answers"] ?? "",
      blankCount,
    );
    if (parsedBlanks.error) {
      return { error: { rowNumber, message: parsedBlanks.error } };
    }
    blankAnswers = parsedBlanks.blankAnswers ?? [];
  }

  if (type === "multiple-choice") {
    if (optionsResult.error) {
      return { error: { rowNumber, message: optionsResult.error } };
    }
    options = optionsResult.options ?? [];

    const correctRaw = record.Correct?.trim() ?? "";
    correct = Number(correctRaw);
    if (!Number.isInteger(correct) || correct < 1 || correct > options.length) {
      return {
        error: {
          rowNumber,
          message: `Correct must be 1–${options.length} for multiple-choice rows (Option 1 = 1).`,
        },
      };
    }
  }

  if (type === "free-response") {
    if (importKind === "legacy-alcumus" && acceptedAnswers.length === 0) {
      return {
        error: {
          rowNumber,
          message: "Accepted Answers is required for free-response rows.",
        },
      };
    }
    if (importKind !== "legacy-alcumus" && acceptedAnswers.length === 0 && !minLength) {
      return {
        error: {
          rowNumber,
          message:
            "Free-response end-of-chapter rows need Accepted Answers and/or Min Length.",
        },
      };
    }
    if ((record["Min Length"] ?? "").trim() && minLength === null) {
      return { error: { rowNumber, message: "Min Length must be a number when provided." } };
    }
  }

  let level: AlcumusLevel;
  const levelRaw = (record.Level ?? "").trim();
  if (levelRaw) {
    const parsedLevel = Number(levelRaw);
    if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 5) {
      return { error: { rowNumber, message: "Level must be a whole number from 1 to 5." } };
    }
    level = parsedLevel as AlcumusLevel;
  } else if (importKind === "legacy-alcumus") {
    level = 3;
  } else {
    level = 1;
  }

  const hint = record.Hint?.trim();

  return {
    row: {
      rowNumber,
      chapter,
      section,
      type,
      question,
      options,
      correct,
      acceptedAnswers,
      blankAnswers,
      hint: hint || undefined,
      level,
      minLength: minLength ?? undefined,
    },
  };
}

export function parseQuestionCsv(
  text: string,
  kind: CsvImportKind,
): { rows: ParsedCsvRow[]; errors: CsvRowError[] } {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, message: "The file is empty." }] };
  }

  const [headerRow, ...dataRows] = table;
  const headers = headerRow.map((cell) => cell.trim());
  const required = ["Chapter", "Section", "Type", "Question"];
  const missing = required.filter((name) => headerIndex(headers, name) === -1);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          message: `Missing required column(s): ${missing.join(", ")}.`,
        },
      ],
    };
  }

  const rows: ParsedCsvRow[] = [];
  const errors: CsvRowError[] = [];

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    if (cells.every((cell) => !cell.trim())) return;

    const result = validateRow(rowNumber, readRecord(headers, cells), kind);
    if (result.error) errors.push(result.error);
    if (result.row) rows.push(result.row);
  });

  return { rows, errors };
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

function rowToChapterQuestion(row: ParsedCsvRow, index: number): ChapterQuestion {
  const id = `chapter-${Date.now()}-${row.rowNumber}-${index}`;
  const hint = row.hint;
  const difficulty = row.level ?? 1;

  if (row.type === "fill-in-the-blank") {
    return {
      type: "fill-in-the-blank",
      id,
      prompt: row.question,
      blankAnswers: row.blankAnswers,
      hint,
      difficulty,
    };
  }
  if (row.type === "free-response") {
    if (row.minLength) {
      return {
        type: "long-answer",
        id,
        prompt: row.question,
        minLength: row.minLength,
        hint,
        difficulty,
      };
    }
    return {
      type: "short-answer",
      id,
      prompt: row.question,
      acceptedAnswers: row.acceptedAnswers,
      hint,
      difficulty,
    };
  }
  return {
    type: "multiple-choice",
    id,
    prompt: row.question,
    options: row.options,
    correctIndex: (row.correct ?? 1) - 1,
    hint,
    difficulty,
  };
}

export function buildImportPreview(
  csvText: string,
  kind: CsvImportKind,
  course: Course,
  fallbackLessonId: string,
  existingQuestionBank: Record<string, ChapterQuestion[]> = {},
): CsvImportPreview {
  const { rows, errors } = parseQuestionCsv(csvText, kind);
  const rawQuestionBankByLessonKey: Record<string, ChapterQuestion[]> = {};

  rows.forEach((row, index) => {
    const lessonId = findLessonId(course, row.chapter, row.section, fallbackLessonId);
    if (!lessonId) {
      errors.push({
        rowNumber: row.rowNumber,
        message: `No lesson found for Chapter ${row.chapter}, Section ${row.section}. Set chapter/section on a lesson in Curriculum, or leave both blank to import into the selected lesson.`,
      });
      return;
    }

    const key = lessonKey(course.id, lessonId);
    if (!rawQuestionBankByLessonKey[key]) rawQuestionBankByLessonKey[key] = [];
    rawQuestionBankByLessonKey[key].push(rowToChapterQuestion(row, index));
  });

  const {
    filteredByLesson: questionBankByLessonKey,
    importableCount,
    skippedDuplicateCount,
  } = filterNewChapterQuestionsByLesson(
    existingQuestionBank,
    rawQuestionBankByLessonKey,
  );

  return {
    kind,
    rows,
    errors,
    questionBankByLessonKey,
    alcumusByLessonKey: {},
    chapterQuestionsByLessonKey: {},
    importableCount,
    skippedDuplicateCount,
  };
}

export function serializeExampleRow(kind: CsvImportKind, type: CsvRowType): string {
  const level =
    kind === "alcumus" ? "4" : kind === "end-of-chapter" ? "1" : "2";

  if (type === "fill-in-the-blank") {
    return [
      escapeCsvField("3"),
      escapeCsvField("1"),
      escapeCsvField("fill-in-the-blank"),
      escapeCsvField(
        "The ________ is the powerhouse of the cell because it produces ATP.",
      ),
      "",
      "",
      "",
      "",
      "",
      escapeCsvField("mitochondria"),
      "",
      escapeCsvField("Think about organelles."),
      escapeCsvField(level),
    ].join(",");
  }

  if (type === "multiple-choice") {
    return [
      escapeCsvField("3"),
      escapeCsvField("1"),
      escapeCsvField("multiple-choice"),
      escapeCsvField("Photosynthesis occurs primarily in plant leaves. True or false?"),
      escapeCsvField("True"),
      escapeCsvField("False"),
      "",
      "",
      escapeCsvField("1"),
      "",
      "",
      escapeCsvField("Recall where chlorophyll is found."),
      escapeCsvField(level),
    ].join(",");
  }

  return [
    escapeCsvField("3"),
    escapeCsvField("1"),
    escapeCsvField("free-response"),
    escapeCsvField("Explain how energy transforms during a roller coaster ride."),
    "",
    "",
    "",
    "",
    "",
    escapeCsvField("kinetic; potential; gravitational"),
    escapeCsvField("40"),
    escapeCsvField("Name both forms of mechanical energy."),
    escapeCsvField(level),
  ].join(",");
}

export function kindLabel(kind: CsvImportKind): string {
  if (kind === "alcumus") return "Extra practice (legacy Alcumus CSV)";
  if (kind === "end-of-chapter") return "End-of-chapter (legacy CSV)";
  return "Chapter questions";
}
