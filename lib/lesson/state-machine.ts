import { MAX_END_OF_CHAPTER_QUESTIONS } from "@/lib/lesson/types";

export type Difficulty = 1 | 2 | 3;

export type LessonMachineState = {
  questionIndex: number;
  difficulty: Difficulty;
  completedCount: number;
  completedQuestionIds: string[];
  heldQuestionIds: string[];
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
  completedQuestionIds: [],
  heldQuestionIds: [],
  feedback: null,
  feedbackTone: null,
  toast: null,
  isComplete: false,
  assignmentCount: MAX_END_OF_CHAPTER_QUESTIONS,
};

export function completedQuestionCount(state: LessonMachineState): number {
  if (state.completedQuestionIds.length > 0) {
    return state.completedQuestionIds.length;
  }
  return state.completedCount;
}

export function progressPercent(state: LessonMachineState): number {
  if (state.isComplete) return 100;
  if (state.assignmentCount <= 0) return 0;
  return Math.round(
    (completedQuestionCount(state) / state.assignmentCount) * 100,
  );
}

export function resolveActiveQuestionIndex(
  lesson: { id: string }[],
  state: Pick<
    LessonMachineState,
    "completedQuestionIds" | "heldQuestionIds" | "assignmentCount"
  >,
  isLockedToday: (questionId: string) => boolean,
): number | null {
  const completed = new Set(state.completedQuestionIds);
  const held = new Set(state.heldQuestionIds);

  for (let index = 0; index < lesson.length; index++) {
    const id = lesson[index].id;
    if (completed.has(id)) continue;
    if (held.has(id) && isLockedToday(id)) continue;
    return index;
  }

  return null;
}

export function hasHeldQuestionsRemaining(
  lesson: { id: string }[],
  state: Pick<LessonMachineState, "completedQuestionIds" | "heldQuestionIds">,
  isLockedToday: (questionId: string) => boolean,
): boolean {
  const completed = new Set(state.completedQuestionIds);
  const held = new Set(state.heldQuestionIds);

  return lesson.some(
    (question) =>
      !completed.has(question.id) &&
      held.has(question.id) &&
      isLockedToday(question.id),
  );
}

export function applyCorrectAnswer(
  state: LessonMachineState,
  questionId: string,
): LessonMachineState {
  if (state.completedQuestionIds.includes(questionId)) {
    return state;
  }

  const completedQuestionIds = [...state.completedQuestionIds, questionId];
  const heldQuestionIds = state.heldQuestionIds.filter((id) => id !== questionId);
  const isComplete = completedQuestionIds.length >= state.assignmentCount;

  if (isComplete) {
    return {
      ...state,
      completedQuestionIds,
      heldQuestionIds,
      completedCount: completedQuestionIds.length,
      feedback: null,
      feedbackTone: null,
      toast: "Submitted for parent review! Lesson complete.",
      isComplete: true,
    };
  }

  const nextDifficulty = Math.min(3, state.difficulty + 1) as Difficulty;

  return {
    ...state,
    completedQuestionIds,
    heldQuestionIds,
    completedCount: completedQuestionIds.length,
    questionIndex: state.questionIndex + 1,
    difficulty: nextDifficulty,
    feedback: null,
    feedbackTone: null,
    toast: "Correct! Moving to the next question...",
    isComplete: false,
  };
}

export function applyQuestionHeldForToday(
  state: LessonMachineState,
  questionId: string,
): LessonMachineState {
  if (state.completedQuestionIds.includes(questionId)) {
    return state;
  }

  const heldQuestionIds = state.heldQuestionIds.includes(questionId)
    ? state.heldQuestionIds
    : [...state.heldQuestionIds, questionId];

  return {
    ...state,
    heldQuestionIds,
    feedback: null,
    feedbackTone: null,
    toast:
      "This question is on hold until tomorrow. You can continue with the other assignment questions.",
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

  const completedQuestionIds = state.completedQuestionIds.slice(0, count);
  const heldQuestionIds = state.heldQuestionIds.filter(
    (id) => !completedQuestionIds.includes(id),
  );
  const clampedIndex = Math.min(state.questionIndex, Math.max(0, count - 1));
  const completedCount = completedQuestionIds.length;
  const isComplete = count > 0 && completedCount >= count;

  return {
    ...state,
    assignmentCount: count,
    questionIndex: clampedIndex,
    completedQuestionIds,
    heldQuestionIds,
    completedCount,
    isComplete,
  };
}

export function hydrateLessonState(
  state: LessonMachineState,
  lesson: { id: string }[],
  isLockedToday: (questionId: string) => boolean,
): LessonMachineState {
  let next = withAssignmentCount(state, lesson.length);

  const completedQuestionIds =
    next.completedQuestionIds.length > 0
      ? next.completedQuestionIds
      : lesson.slice(0, next.completedCount).map((question) => question.id);

  const heldQuestionIds = next.heldQuestionIds.filter(isLockedToday);
  const completedCount = completedQuestionIds.length;
  const isComplete =
    next.assignmentCount > 0 && completedCount >= next.assignmentCount;
  const activeIndex = isComplete
    ? null
    : resolveActiveQuestionIndex(
        lesson,
        { ...next, completedQuestionIds, heldQuestionIds },
        isLockedToday,
      );

  return {
    ...next,
    completedQuestionIds,
    heldQuestionIds,
    completedCount,
    isComplete,
    questionIndex: activeIndex ?? next.questionIndex,
  };
}
