import type { AdminFlashcard } from "@/lib/lesson/admin-flashcard-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeAnswers(values: string[]): string[] {
  return values.map((value) => normalizeText(value).toLowerCase()).sort();
}

function normalizeBlankAnswers(blankAnswers: string[][]): string[][] {
  return blankAnswers.map((group) => normalizeAnswers(group));
}

export function lessonQuestionContentKey(question: LessonQuestion): string {
  const hint = normalizeText(question.hint ?? "");

  switch (question.type) {
    case "multiple-choice":
      return JSON.stringify({
        type: "multiple-choice",
        prompt: normalizeText(question.prompt),
        options: question.options.map(normalizeText),
        correctIndex: question.correctIndex,
        hint,
      });
    case "fill-in-the-blank":
      return JSON.stringify({
        type: "fill-in-the-blank",
        prompt: normalizeText(question.prompt),
        blankAnswers: normalizeBlankAnswers(question.blankAnswers),
        hint,
      });
    case "short-answer":
      return JSON.stringify({
        type: "short-answer",
        prompt: normalizeText(question.prompt),
        acceptedAnswers: normalizeAnswers(question.acceptedAnswers),
        hint,
      });
    case "long-answer":
      return JSON.stringify({
        type: "long-answer",
        prompt: normalizeText(question.prompt),
        minLength: question.minLength,
        hint,
      });
    default: {
      const _exhaustive: never = question;
      return JSON.stringify(_exhaustive);
    }
  }
}

export function chapterQuestionContentKey(question: ChapterQuestion): string {
  return JSON.stringify({
    content: JSON.parse(lessonQuestionContentKey(question)),
    difficulty: question.difficulty,
  });
}

export function flashcardContentKey(card: Pick<AdminFlashcard, "term">): string {
  return normalizeText(card.term).toLowerCase();
}

export function partitionNewItems<T>(
  existing: readonly T[],
  incoming: readonly T[],
  contentKey: (item: T) => string,
): { newItems: T[]; skippedDuplicateCount: number } {
  const seen = new Set(existing.map(contentKey));
  const newItems: T[] = [];
  let skippedDuplicateCount = 0;

  for (const item of incoming) {
    const key = contentKey(item);
    if (seen.has(key)) {
      skippedDuplicateCount += 1;
      continue;
    }
    seen.add(key);
    newItems.push(item);
  }

  return { newItems, skippedDuplicateCount };
}

export function filterNewChapterQuestionsByLesson(
  existingByLesson: Record<string, ChapterQuestion[]>,
  incomingByLesson: Record<string, ChapterQuestion[]>,
): {
  filteredByLesson: Record<string, ChapterQuestion[]>;
  importableCount: number;
  skippedDuplicateCount: number;
} {
  const filteredByLesson: Record<string, ChapterQuestion[]> = {};
  let importableCount = 0;
  let skippedDuplicateCount = 0;

  for (const [key, incoming] of Object.entries(incomingByLesson)) {
    const { newItems, skippedDuplicateCount: skipped } = partitionNewItems(
      existingByLesson[key] ?? [],
      incoming,
      chapterQuestionContentKey,
    );
    if (newItems.length > 0) {
      filteredByLesson[key] = newItems;
    }
    importableCount += newItems.length;
    skippedDuplicateCount += skipped;
  }

  return { filteredByLesson, importableCount, skippedDuplicateCount };
}

export function filterNewLessonQuestionsByLesson(
  existingByLesson: Record<string, LessonQuestion[]>,
  incomingByLesson: Record<string, LessonQuestion[]>,
): {
  filteredByLesson: Record<string, LessonQuestion[]>;
  importableCount: number;
  skippedDuplicateCount: number;
} {
  const filteredByLesson: Record<string, LessonQuestion[]> = {};
  let importableCount = 0;
  let skippedDuplicateCount = 0;

  for (const [key, incoming] of Object.entries(incomingByLesson)) {
    const { newItems, skippedDuplicateCount: skipped } = partitionNewItems(
      existingByLesson[key] ?? [],
      incoming,
      lessonQuestionContentKey,
    );
    if (newItems.length > 0) {
      filteredByLesson[key] = newItems;
    }
    importableCount += newItems.length;
    skippedDuplicateCount += skipped;
  }

  return { filteredByLesson, importableCount, skippedDuplicateCount };
}

export function filterNewFlashcardsByLesson(
  existingByLesson: Record<string, AdminFlashcard[]>,
  incomingByLesson: Record<string, AdminFlashcard[]>,
): {
  filteredByLesson: Record<string, AdminFlashcard[]>;
  importableCount: number;
  skippedDuplicateCount: number;
} {
  const filteredByLesson: Record<string, AdminFlashcard[]> = {};
  let importableCount = 0;
  let skippedDuplicateCount = 0;

  for (const [key, incoming] of Object.entries(incomingByLesson)) {
    const { newItems, skippedDuplicateCount: skipped } = partitionNewItems(
      existingByLesson[key] ?? [],
      incoming,
      flashcardContentKey,
    );
    if (newItems.length > 0) {
      filteredByLesson[key] = newItems;
    }
    importableCount += newItems.length;
    skippedDuplicateCount += skipped;
  }

  return { filteredByLesson, importableCount, skippedDuplicateCount };
}

export function formatCsvImportPreviewSummary(
  importableCount: number,
  skippedDuplicateCount: number,
  unitSingular: string,
  unitPlural?: string,
): string {
  const plural = unitPlural ?? `${unitSingular}s`;
  const unit = importableCount === 1 ? unitSingular : plural;

  if (importableCount === 0 && skippedDuplicateCount > 0) {
    return `No new ${plural} to import (${skippedDuplicateCount} duplicate${skippedDuplicateCount === 1 ? "" : "s"} already in the bank).`;
  }

  let summary = `${importableCount} ${unit} ready to import`;
  if (skippedDuplicateCount > 0) {
    summary += ` (${skippedDuplicateCount} duplicate${skippedDuplicateCount === 1 ? "" : "s"} skipped)`;
  }
  return summary;
}

export function formatCsvImportResultMessage(
  importableCount: number,
  skippedDuplicateCount: number,
  unitSingular: string,
  unitPlural?: string,
): string {
  const plural = unitPlural ?? `${unitSingular}s`;

  if (importableCount === 0 && skippedDuplicateCount > 0) {
    return `No new ${plural} imported (${skippedDuplicateCount} duplicate${skippedDuplicateCount === 1 ? "" : "s"} skipped).`;
  }

  const unit = importableCount === 1 ? unitSingular : plural;
  let message = `Imported ${importableCount} ${unit}`;
  if (skippedDuplicateCount > 0) {
    message += ` (${skippedDuplicateCount} duplicate${skippedDuplicateCount === 1 ? "" : "s"} skipped)`;
  }
  return `${message}.`;
}
