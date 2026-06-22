import type { LessonQuestion } from "@/lib/lesson/types";

/** Max wrong submits per calendar day (MC: min(2, options − 1); others: 2). */
export function getMaxAttempts(question: LessonQuestion): number | null {
  if (question.type === "long-answer") return null;

  if (question.type === "multiple-choice") {
    return Math.min(2, Math.max(1, question.options.length - 1));
  }

  return 2;
}

export function getCalendarDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type QuestionAttemptRecord = {
  attemptsUsed: number;
  lastAttemptDay: string;
  exhaustedOnDay: string | null;
};

export function getQuestionAttemptState(
  record: QuestionAttemptRecord | null | undefined,
  today = getCalendarDayKey(),
): { attemptsUsed: number; isLocked: boolean } {
  if (!record) return { attemptsUsed: 0, isLocked: false };

  if (record.exhaustedOnDay) {
    if (record.exhaustedOnDay < today) {
      return { attemptsUsed: 0, isLocked: false };
    }
    if (record.exhaustedOnDay === today) {
      return { attemptsUsed: record.attemptsUsed, isLocked: true };
    }
  }

  if (record.lastAttemptDay < today) {
    return { attemptsUsed: 0, isLocked: false };
  }

  return { attemptsUsed: record.attemptsUsed, isLocked: false };
}

export function afterQuestionAttempt(
  record: QuestionAttemptRecord | null | undefined,
  maxAttempts: number,
  correct: boolean,
  today = getCalendarDayKey(),
): QuestionAttemptRecord {
  if (correct) {
    return { attemptsUsed: 0, lastAttemptDay: today, exhaustedOnDay: null };
  }

  const { attemptsUsed } = getQuestionAttemptState(record, today);
  const nextUsed = attemptsUsed + 1;
  const exhausted = nextUsed >= maxAttempts;

  return {
    attemptsUsed: nextUsed,
    lastAttemptDay: today,
    exhaustedOnDay: exhausted ? today : null,
  };
}

export function attemptsRemaining(
  attemptsUsed: number,
  maxAttempts: number,
): number {
  return Math.max(0, maxAttempts - attemptsUsed);
}
