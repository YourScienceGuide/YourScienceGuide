import { MAX_END_OF_CHAPTER_QUESTIONS } from "@/lib/lesson/types";

export type Difficulty = 1 | 2 | 3;

export type LessonMachineState = {
  questionIndex: number;
  difficulty: Difficulty;
  completedCount: number;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  toast: string | null;
  isComplete: boolean;
  /** Number of required assignment questions for this lesson. */
  assignmentCount: number;
};

export const INITIAL_LESSON_STATE: LessonMachineState = {
  questionIndex: 0,
  difficulty: 1,
  completedCount: 0,
  feedback: null,
  feedbackTone: null,
  toast: null,
  isComplete: false,
  assignmentCount: MAX_END_OF_CHAPTER_QUESTIONS,
};

export function progressPercent(state: LessonMachineState): number {
  if (state.isComplete) return 100;
  if (state.assignmentCount <= 0) return 0;
  return Math.round((state.completedCount / state.assignmentCount) * 100);
}

export function applyCorrectAnswer(
  state: LessonMachineState,
): LessonMachineState {
  const nextCompleted = state.completedCount + 1;
  const isLast = state.questionIndex >= state.assignmentCount - 1;

  if (isLast) {
    return {
      ...state,
      completedCount: state.assignmentCount,
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
    toast: "Correct! Moving to the next question...",
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

export function withAssignmentCount(
  state: LessonMachineState,
  assignmentCount: number,
): LessonMachineState {
  const count = Math.max(0, assignmentCount);
  if (count === state.assignmentCount) return state;

  const clampedIndex = Math.min(state.questionIndex, Math.max(0, count - 1));
  const clampedCompleted = Math.min(state.completedCount, count);
  const isComplete = count > 0 && clampedCompleted >= count;

  return {
    ...state,
    assignmentCount: count,
    questionIndex: clampedIndex,
    completedCount: clampedCompleted,
    isComplete,
  };
}
