import type { LessonQuestion } from "@/lib/lesson/types";

const DEFAULT_INCORRECT_HINT =
  "Review the lesson material, then try again.";

export function getQuestionHint(question: LessonQuestion): string {
  const hint = question.hint?.trim();
  return hint || DEFAULT_INCORRECT_HINT;
}

export const LOCKED_UNTIL_TOMORROW_MESSAGE =
  "You've used all your tries for today. Come back tomorrow to try again.";
