import {
  applyCorrectAnswer,
  applyQuestionHeldForToday,
  type LessonMachineState,
} from "@/lib/lesson/state-machine";

export function applyReviewCorrectAnswer(
  state: LessonMachineState,
  questionId: string,
): LessonMachineState {
  const next = applyCorrectAnswer(state, questionId);
  if (next.isComplete) {
    return {
      ...next,
      toast: "Review complete! Continue to the lesson below.",
    };
  }
  return {
    ...next,
    toast: "Correct! Next review question...",
  };
}

export function applyReviewHeldForToday(
  state: LessonMachineState,
  questionId: string,
): LessonMachineState {
  const next = applyQuestionHeldForToday(state, questionId);
  return {
    ...next,
    toast:
      "This review question is on hold until tomorrow. You can continue with the other review questions.",
  };
}
