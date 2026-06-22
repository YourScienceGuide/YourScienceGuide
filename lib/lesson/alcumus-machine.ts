import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import { getQuestionHint } from "@/lib/lesson/question-hint";
import { checkFillInBlank, validateAnswer } from "@/lib/lesson/validate-answer";

export type AlcumusState = {
  level: AlcumusLevel;
  problemId: string;
  streak: number;
  solved: number;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  toast: string | null;
};

function problemsAtLevel(pool: ChapterQuestion[], level: AlcumusLevel) {
  return pool.filter((p) => p.difficulty === level);
}

function levelsWithProblems(pool: ChapterQuestion[]): AlcumusLevel[] {
  const levels = new Set<AlcumusLevel>();
  for (const problem of pool) {
    levels.add(problem.difficulty);
  }
  return [...levels].sort((a, b) => a - b);
}

function resolveLevel(pool: ChapterQuestion[], preferred: AlcumusLevel): AlcumusLevel {
  if (problemsAtLevel(pool, preferred).length > 0) {
    return preferred;
  }

  const available = levelsWithProblems(pool);
  if (available.length === 0) {
    return preferred;
  }

  return available.reduce((best, level) =>
    Math.abs(level - preferred) < Math.abs(best - preferred) ? level : best,
  );
}

function getProblemById(pool: ChapterQuestion[], id: string) {
  return pool.find((p) => p.id === id);
}

function pickProblem(
  pool: ChapterQuestion[],
  level: AlcumusLevel,
  excludeId?: string,
): ChapterQuestion | undefined {
  if (pool.length === 0) return undefined;

  const withoutExcluded = excludeId
    ? pool.filter((problem) => problem.id !== excludeId)
    : pool;
  const searchPool = withoutExcluded.length > 0 ? withoutExcluded : pool;
  const atLevel = searchPool.filter((problem) => problem.difficulty === level);
  const list = atLevel.length > 0 ? atLevel : searchPool;

  return list[Math.floor(Math.random() * list.length)];
}

function pickNextProblem(
  pool: ChapterQuestion[],
  level: AlcumusLevel,
  excludeId?: string,
): ChapterQuestion | undefined {
  return (
    pickProblem(pool, level, excludeId) ??
    pickProblem(pool, level) ??
    getProblemById(pool, excludeId ?? "") ??
    pool[0]
  );
}

export function createInitialAlcumusState(pool: ChapterQuestion[]): AlcumusState {
  const startLevel = resolveLevel(pool, 3);
  const problem = pickNextProblem(pool, startLevel) ?? pool[0];
  return {
    level: startLevel,
    problemId: problem.id,
    streak: 0,
    solved: 0,
    feedback: null,
    feedbackTone: null,
    toast: null,
  };
}

export function getCurrentProblem(
  pool: ChapterQuestion[],
  state: AlcumusState,
): ChapterQuestion {
  return (
    getProblemById(pool, state.problemId) ??
    pickNextProblem(pool, state.level) ??
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
  if (pool.length === 0) return state;

  const desiredLevel = Math.min(5, state.level + 1) as AlcumusLevel;
  const nextLevel = resolveLevel(pool, desiredLevel);
  const next = pickNextProblem(pool, nextLevel, state.problemId) ?? pool[0];

  return {
    level: nextLevel,
    problemId: next.id,
    streak: state.streak + 1,
    solved: state.solved + 1,
    feedback: null,
    feedbackTone: null,
    toast:
      nextLevel > state.level
        ? "Correct! Moving to a harder problem..."
        : "Correct! Keep going...",
  };
}

export function applyAlcumusIncorrect(
  pool: ChapterQuestion[],
  state: AlcumusState,
): AlcumusState {
  if (pool.length === 0) return state;

  const problem = getCurrentProblem(pool, state);
  const desiredLevel = Math.max(1, state.level - 1) as AlcumusLevel;
  const nextLevel = resolveLevel(pool, desiredLevel);
  const next = pickNextProblem(pool, nextLevel, state.problemId) ?? pool[0];

  return {
    level: nextLevel,
    problemId: next.id,
    streak: 0,
    solved: state.solved,
    feedback: getQuestionHint(problem),
    feedbackTone: "retry",
    toast: null,
  };
}

export function clearAlcumusToast(state: AlcumusState): AlcumusState {
  return { ...state, toast: null };
}

export const LEVEL_LABELS: Record<AlcumusLevel, string> = {
  1: "Intro",
  2: "Core",
  3: "Proficient",
  4: "Advanced",
  5: "Expert",
};

/** Problems solved toward full mastery at the current difficulty band. */
export const MASTERY_SOLVED_TARGET = 8;

/** Combined level ramp (60%) and solved volume (40%) toward mastery. */
export function masteryPercent(state: AlcumusState): number {
  const levelProgress = ((state.level - 1) / 4) * 60;
  const volumeProgress = Math.min(
    40,
    (state.solved / MASTERY_SOLVED_TARGET) * 40,
  );
  return Math.min(100, Math.round(levelProgress + volumeProgress));
}

export function masteryStepLabel(state: AlcumusState): string {
  return `Level ${state.level} · ${LEVEL_LABELS[state.level]}`;
}

/** @deprecated Use checkPracticeAnswer */
export function checkAlcumusAnswer(
  problem: ChapterQuestion,
  payload: { selectedIndex?: number | null; text?: string },
): boolean {
  return checkPracticeAnswer(problem, payload);
}
