import { LESSON_QUESTION_COUNT } from "@/lib/lesson/types";

export function lessonStepLabel(
  questionIndex: number,
  isComplete: boolean,
): string {
  if (isComplete) {
    return `Lesson complete · ${LESSON_QUESTION_COUNT} of ${LESSON_QUESTION_COUNT}`;
  }
  return `Question ${questionIndex + 1} of ${LESSON_QUESTION_COUNT}`;
}
