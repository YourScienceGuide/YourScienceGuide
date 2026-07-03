import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import {
  EXTRA_PRACTICE_SESSION_SIZE,
  selectExtraPracticeSession,
} from "@/lib/lesson/chapter-questions";
import { getQuestionHint } from "@/lib/lesson/question-hint";
import { checkFillInBlank, validateAnswer } from "@/lib/lesson/validate-answer";

export type AlcumusState = {
  /** Question ids for this fixed-length session. */
  questionIds: string[];
  questionIndex: number;
  solved: number;
  isComplete: boolean;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  toast: string | null;
};

function getProblemById(pool: ChapterQuestion[], id: string) {
  return pool.find((p) => p.id === id);
}

export function createInitialAlcumusState(
  pool: ChapterQuestion[],
  sessionSeed: string,
): AlcumusState {
  const session = selectExtraPracticeSession(pool, sessionSeed);
  const questionIds = session.map((question) => question.id);

  return {
    questionIds,
    questionIndex: 0,
    solved: 0,
    isComplete: questionIds.length === 0,
    feedback: null,
    feedbackTone: null,
    toast: null,
  };
}

export function normalizeAlcumusState(
  stored: Partial<AlcumusState> | null | undefined,
  pool: ChapterQuestion[],
  sessionSeed: string,
): AlcumusState {
  const poolIds = new Set(pool.map((question) => question.id));
  const questionIds =
    stored?.questionIds?.filter((id) => poolIds.has(id)) ?? [];

  if (questionIds.length > 0) {
    const questionIndex = Math.min(
      stored?.questionIndex ?? 0,
      Math.max(0, questionIds.length - 1),
    );
    const solved = Math.min(stored?.solved ?? 0, questionIds.length);
    const isComplete =
      stored?.isComplete === true || solved >= questionIds.length;

    return {
      questionIds,
      questionIndex: isComplete ? questionIds.length - 1 : questionIndex,
      solved,
      isComplete,
      feedback: stored?.feedback ?? null,
      feedbackTone: stored?.feedbackTone ?? null,
      toast: null,
    };
  }

  return createInitialAlcumusState(pool, sessionSeed);
}

export function getCurrentProblem(
  pool: ChapterQuestion[],
  state: AlcumusState,
): ChapterQuestion {
  const currentId = state.questionIds[state.questionIndex];
  return (
    getProblemById(pool, currentId) ??
    getProblemById(pool, state.questionIds[0] ?? "") ??
    pool[0]
  );
}

export function checkPracticeAnswer(
  question: ChapterQuestion,
  payload: {
    selectedIndex?: number | null;
    text?: string;
    longAnswer?: string;
    blankAnswers?: string[];
  },
): boolean {
  if (question.type === "fill-in-the-blank") {
    return checkFillInBlank(question, payload.blankAnswers ?? []).correct;
  }
  return validateAnswer(question, {
    selectedIndex: payload.selectedIndex,
    text: payload.text ?? payload.longAnswer,
  });
}

export function applyAlcumusCorrect(
  pool: ChapterQuestion[],
  state: AlcumusState,
): AlcumusState {
  if (pool.length === 0 || state.isComplete || state.questionIds.length === 0) {
    return state;
  }

  const solved = state.solved + 1;
  const isLast = state.questionIndex >= state.questionIds.length - 1;

  if (isLast) {
    return {
      ...state,
      solved,
      isComplete: true,
      feedback: null,
      feedbackTone: null,
      toast: "Extra practice complete! Nice work.",
    };
  }

  return {
    ...state,
    solved,
    questionIndex: state.questionIndex + 1,
    feedback: null,
    feedbackTone: null,
    toast: "Correct! Moving to the next question...",
  };
}

export function applyAlcumusIncorrect(
  pool: ChapterQuestion[],
  state: AlcumusState,
): AlcumusState {
  if (pool.length === 0 || state.isComplete) return state;

  const problem = getCurrentProblem(pool, state);

  return {
    ...state,
    feedback: getQuestionHint(problem),
    feedbackTone: "retry",
    toast: null,
  };
}

export function clearAlcumusToast(state: AlcumusState): AlcumusState {
  return { ...state, toast: null };
}

export function clearAlcumusFeedback(state: AlcumusState): AlcumusState {
  return { ...state, feedback: null, feedbackTone: null };
}

export const LEVEL_LABELS: Record<AlcumusLevel, string> = {
  1: "Intro",
  2: "Core",
  3: "Proficient",
  4: "Advanced",
  5: "Expert",
};

export function practicePercent(state: AlcumusState): number {
  if (state.questionIds.length === 0) return 0;
  if (state.isComplete) return 100;
  return Math.round((state.solved / state.questionIds.length) * 100);
}

export function practiceStepLabel(state: AlcumusState): string {
  const total = state.questionIds.length;
  if (total === 0) return "No extra practice questions";
  if (state.isComplete) {
    return `Complete · ${total} of ${total} questions`;
  }

  const current = Math.min(state.questionIndex + 1, total);
  return `Question ${current} of ${total}`;
}

/** @deprecated Use practicePercent */
export function masteryPercent(state: AlcumusState): number {
  return practicePercent(state);
}

/** @deprecated Use practiceStepLabel */
export function masteryStepLabel(state: AlcumusState): string {
  return practiceStepLabel(state);
}

/** @deprecated Use checkPracticeAnswer */
export function checkAlcumusAnswer(
  problem: ChapterQuestion,
  payload: { selectedIndex?: number | null; text?: string },
): boolean {
  return checkPracticeAnswer(problem, payload);
}

export { EXTRA_PRACTICE_SESSION_SIZE };
