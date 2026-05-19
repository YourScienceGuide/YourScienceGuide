import {
  getProblemById,
  problemsAtLevel,
  type AlcumusLevel,
  type AlcumusProblem,
} from "@/lib/lesson/alcumus-problems";

export type AlcumusState = {
  level: AlcumusLevel;
  problemId: string;
  streak: number;
  solved: number;
  feedback: string | null;
  feedbackTone: "success" | "retry" | null;
  toast: string | null;
};

function pickProblem(level: AlcumusLevel, excludeId?: string): AlcumusProblem {
  const pool = problemsAtLevel(level).filter((p) => p.id !== excludeId);
  const candidates = pool.length > 0 ? pool : problemsAtLevel(level);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createInitialAlcumusState(): AlcumusState {
  const problem = pickProblem(1);
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

export function getCurrentProblem(state: AlcumusState): AlcumusProblem {
  return getProblemById(state.problemId) ?? pickProblem(state.level);
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

export function applyAlcumusCorrect(state: AlcumusState): AlcumusState {
  const nextLevel = Math.min(5, state.level + 1) as AlcumusLevel;
  const next = pickProblem(nextLevel, state.problemId);

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

export function applyAlcumusIncorrect(state: AlcumusState): AlcumusState {
  const nextLevel = Math.max(1, state.level - 1) as AlcumusLevel;
  const next = pickProblem(nextLevel, state.problemId);

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
