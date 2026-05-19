import { LESSON_QUESTIONS, QUESTION_COUNT } from "@/lib/lesson/questions";

const STEP_NAMES: Record<string, string> = {
  q1: "Multiple choice",
  q2: "Short answer",
  q3: "Parent review",
};

export function lessonStepLabel(
  questionIndex: number,
  isComplete: boolean,
): string {
  if (isComplete) {
    return `Lesson complete · ${QUESTION_COUNT} of ${QUESTION_COUNT} questions`;
  }
  const question = LESSON_QUESTIONS[questionIndex];
  const name = STEP_NAMES[question.id] ?? "Question";
  return `Question ${questionIndex + 1} of ${QUESTION_COUNT} · ${name}`;
}
