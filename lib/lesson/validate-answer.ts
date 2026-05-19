import type {
  LessonQuestion,
  LongAnswerQuestion,
  MultipleChoiceQuestion,
  ShortAnswerQuestion,
} from "@/lib/lesson/types";

function normalizeShortAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function checkMultipleChoice(
  question: MultipleChoiceQuestion,
  selectedIndex: number | null,
): boolean {
  return selectedIndex === question.correctIndex;
}

export function checkShortAnswer(
  question: ShortAnswerQuestion,
  value: string,
): boolean {
  const normalized = normalizeShortAnswer(value);
  return question.acceptedAnswers.some(
    (answer) => normalizeShortAnswer(answer) === normalized,
  );
}

export function checkLongAnswer(
  question: LongAnswerQuestion,
  value: string,
): boolean {
  return value.trim().length >= question.minLength;
}

export function validateAnswer(
  question: LessonQuestion,
  payload: { selectedIndex?: number | null; text?: string },
): boolean {
  switch (question.type) {
    case "multiple-choice":
      return checkMultipleChoice(
        question,
        payload.selectedIndex ?? null,
      );
    case "short-answer":
      return checkShortAnswer(question, payload.text ?? "");
    case "long-answer":
      return checkLongAnswer(question, payload.text ?? "");
  }
}
