import { QUESTION_COUNT } from "@/lib/lesson/questions";

export type Difficulty = 1 | 2 | 3;

export type LessonMachineState = {
  questionIndex: number;
  difficulty: Difficulty;
  completedCount: number;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  toast: string | null;
  isComplete: boolean;
};

export const INITIAL_LESSON_STATE: LessonMachineState = {
  questionIndex: 0,
  difficulty: 1,
  completedCount: 0,
  feedback: null,
  feedbackTone: null,
  toast: null,
  isComplete: false,
};

export function progressPercent(state: LessonMachineState): number {
  if (state.isComplete) return 100;
  return Math.round((state.completedCount / QUESTION_COUNT) * 100);
}

export function applyCorrectAnswer(
  state: LessonMachineState,
): LessonMachineState {
  const nextCompleted = state.completedCount + 1;
  const isLast = state.questionIndex >= QUESTION_COUNT - 1;

  if (isLast) {
    return {
      ...state,
      completedCount: QUESTION_COUNT,
      feedback: null,
      feedbackTone: null,
      toast: "Submitted for parent review! Lesson complete.",
      isComplete: true,
    };
  }

  const nextDifficulty = Math.min(3, state.difficulty + 1) as Difficulty;

  return {
    ...state,
    completedCount: nextCompleted,
    questionIndex: state.questionIndex + 1,
    difficulty: nextDifficulty,
    feedback: null,
    feedbackTone: null,
    toast: "Correct! Moving to a harder question...",
  };
}

export function applyIncorrectAnswer(
  state: LessonMachineState,
): LessonMachineState {
  return {
    ...state,
    feedback: "Let's try a different approach...",
    feedbackTone: "retry",
    toast: null,
  };
}

export function clearToast(state: LessonMachineState): LessonMachineState {
  return { ...state, toast: null };
}

export function clearFeedback(state: LessonMachineState): LessonMachineState {
  return { ...state, feedback: null, feedbackTone: null };
}
