import { describe, expect, it } from "vitest";

import {
  applyAlcumusCorrect,
  applyAlcumusIncorrect,
  checkAlcumusAnswer,
  createInitialAlcumusState,
  EXTRA_PRACTICE_SESSION_SIZE,
  getCurrentProblem,
  normalizeAlcumusState,
  practicePercent,
  practiceStepLabel,
} from "@/lib/lesson/alcumus-machine";
import { makeAlcumusChoice, makeAlcumusNumeric } from "../../helpers/factories";

describe("alcumus machine", () => {
  const pool = [
    makeAlcumusChoice({ id: "c1", level: 3 }),
    makeAlcumusChoice({ id: "c2", level: 4 }),
    makeAlcumusNumeric({ id: "n1", level: 5 }),
    makeAlcumusChoice({ id: "c3", level: 3 }),
    makeAlcumusChoice({ id: "c4", level: 4 }),
    makeAlcumusNumeric({ id: "n2", level: 5 }),
  ];

  const sessionSeed = "student-a/biology/scientific-method/extra-practice";

  it("creates a five-question session from the pool", () => {
    const state = createInitialAlcumusState(pool, sessionSeed);
    expect(state.questionIds).toHaveLength(EXTRA_PRACTICE_SESSION_SIZE);
    expect(state.questionIndex).toBe(0);
    expect(state.solved).toBe(0);
    expect(state.isComplete).toBe(false);
  });

  it("resolves current problem from the session", () => {
    const state = createInitialAlcumusState(pool, sessionSeed);
    const problem = getCurrentProblem(pool, state);
    expect(state.questionIds).toContain(problem.id);
  });

  it("checks choice and numeric answers", () => {
    const choice = makeAlcumusChoice({ correctIndex: 1 });
    expect(checkAlcumusAnswer(choice, { selectedIndex: 1 })).toBe(true);
    expect(checkAlcumusAnswer(choice, { selectedIndex: 0 })).toBe(false);

    const numeric = makeAlcumusNumeric({ acceptedAnswers: ["3.14", "3.141"] });
    expect(checkAlcumusAnswer(numeric, { text: " 3.14 " })).toBe(true);
    expect(checkAlcumusAnswer(numeric, { text: "2.71" })).toBe(false);
  });

  it("advances through the session on correct answers", () => {
    let state = createInitialAlcumusState(pool, sessionSeed);

    for (let index = 0; index < EXTRA_PRACTICE_SESSION_SIZE - 1; index++) {
      state = applyAlcumusCorrect(pool, state);
      expect(state.isComplete).toBe(false);
      expect(state.solved).toBe(index + 1);
      expect(state.questionIndex).toBe(index + 1);
    }

    state = applyAlcumusCorrect(pool, state);
    expect(state.isComplete).toBe(true);
    expect(state.solved).toBe(EXTRA_PRACTICE_SESSION_SIZE);
  });

  it("keeps the same problem on incorrect answers", () => {
    const initial = createInitialAlcumusState(pool, sessionSeed);
    const afterIncorrect = applyAlcumusIncorrect(pool, initial);

    expect(afterIncorrect.questionIndex).toBe(initial.questionIndex);
    expect(afterIncorrect.solved).toBe(initial.solved);
    expect(afterIncorrect.feedbackTone).toBe("retry");
  });

  it("computes practice progress from solved questions", () => {
    const state = {
      ...createInitialAlcumusState(pool, sessionSeed),
      solved: 2,
      questionIndex: 2,
    };

    expect(practicePercent(state)).toBe(40);
    expect(practiceStepLabel(state)).toBe("Question 3 of 5");
  });

  it("normalizes legacy persisted state into a new session", () => {
    const normalized = normalizeAlcumusState(
      {
        level: 3,
        problemId: "missing",
        streak: 2,
        solved: 4,
      } as never,
      pool,
      sessionSeed,
    );

    expect(normalized.questionIds).toHaveLength(EXTRA_PRACTICE_SESSION_SIZE);
    expect(normalized.questionIndex).toBe(0);
  });

  it("handles empty pool without advancing", () => {
    const state = {
      questionIds: [],
      questionIndex: 0,
      solved: 0,
      isComplete: true,
      feedback: null,
      feedbackTone: null,
      toast: null,
    };
    expect(applyAlcumusCorrect([], state)).toEqual(state);
    expect(applyAlcumusIncorrect([], state)).toEqual(state);
  });
});
