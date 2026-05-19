import type { AlcumusLevel, AlcumusProblem } from "@/lib/lesson/alcumus-types";

export type AlcumusState = {
  level: AlcumusLevel;
  problemId: string;
  streak: number;
  solved: number;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  toast: string | null;
};

function problemsAtLevel(pool: AlcumusProblem[], level: AlcumusLevel) {
  return pool.filter((p) => p.level === level);
}

function getProblemById(pool: AlcumusProblem[], id: string) {
  return pool.find((p) => p.id === id);
}

function pickProblem(
  pool: AlcumusProblem[],
  level: AlcumusLevel,
  excludeId?: string,
): AlcumusProblem {
  const candidates = problemsAtLevel(pool, level).filter(
    (p) => p.id !== excludeId,
  );
  const fallback = problemsAtLevel(pool, level);
  const list = candidates.length > 0 ? candidates : fallback;
  return list[Math.floor(Math.random() * list.length)];
}

export function createInitialAlcumusState(pool: AlcumusProblem[]): AlcumusState {
  const problem = pickProblem(pool, 1);
  return {
    level: 1,
    problemId: problem.id,
    streak: 0,
    solved: 0,
    feedback: null,
    feedbackTone: null,
    toast: null,
  };
}

export function getCurrentProblem(
  pool: AlcumusProblem[],
  state: AlcumusState,
): AlcumusProblem {
  return (
    getProblemById(pool, state.problemId) ?? pickProblem(pool, state.level)
  );
}

export function checkAlcumusAnswer(
  problem: AlcumusProblem,
  payload: { selectedIndex?: number | null; text?: string },
): boolean {
  if (problem.type === "choice") {
    return payload.selectedIndex === problem.correctIndex;
  }
  const normalized = (payload.text ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return (problem.acceptedAnswers ?? []).some(
    (a) => a.trim().toLowerCase().replace(/\s+/g, "") === normalized,
  );
}

export function applyAlcumusCorrect(
  pool: AlcumusProblem[],
  state: AlcumusState,
): AlcumusState {
  const nextLevel = Math.min(5, state.level + 1) as AlcumusLevel;
  const next = pickProblem(pool, nextLevel, state.problemId);

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
  pool: AlcumusProblem[],
  state: AlcumusState,
): AlcumusState {
  const nextLevel = Math.max(1, state.level - 1) as AlcumusLevel;
  const next = pickProblem(pool, nextLevel, state.problemId);

  return {
    level: nextLevel,
    problemId: next.id,
    streak: 0,
    solved: state.solved,
    feedback: "Let's try a different approach...",
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
