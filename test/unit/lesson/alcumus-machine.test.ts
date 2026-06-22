import { describe, expect, it, vi } from "vitest";

import {
  applyAlcumusCorrect,
  applyAlcumusIncorrect,
  checkAlcumusAnswer,
  createInitialAlcumusState,
  getCurrentProblem,
  masteryPercent,
  masteryStepLabel,
} from "@/lib/lesson/alcumus-machine";
import { makeAlcumusChoice, makeAlcumusNumeric } from "../../helpers/factories";

describe("alcumus machine", () => {
  const pool = [
    makeAlcumusChoice({ id: "c1", level: 1 }),
    makeAlcumusChoice({ id: "c2", level: 2 }),
    makeAlcumusNumeric({ id: "n1", level: 3 }),
  ];

  it("creates initial state from pool", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const state = createInitialAlcumusState(pool);
    expect(pool.some((p) => p.id === state.problemId)).toBe(true);
    expect(state.level).toBeGreaterThanOrEqual(1);
    expect(state.level).toBeLessThanOrEqual(5);
  });

  it("resolves current problem with fallback", () => {
    const state = { ...createInitialAlcumusState(pool), problemId: "missing" };
    const problem = getCurrentProblem(pool, state);
    expect(problem).toBeDefined();
  });

  it("checks choice and numeric answers", () => {
    const choice = makeAlcumusChoice({ correctIndex: 1 });
    expect(checkAlcumusAnswer(choice, { selectedIndex: 1 })).toBe(true);
    expect(checkAlcumusAnswer(choice, { selectedIndex: 0 })).toBe(false);

    const numeric = makeAlcumusNumeric({ acceptedAnswers: ["3.14", "3.141"] });
    expect(checkAlcumusAnswer(numeric, { text: " 3.14 " })).toBe(true);
    expect(checkAlcumusAnswer(numeric, { text: "2.71" })).toBe(false);
  });

  it("levels up on correct and down on incorrect", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const initial = createInitialAlcumusState(pool);
    const afterCorrect = applyAlcumusCorrect(pool, initial);
    expect(afterCorrect.solved).toBe(initial.solved + 1);
    expect(afterCorrect.streak).toBe(initial.streak + 1);

    const afterIncorrect = applyAlcumusIncorrect(pool, afterCorrect);
    expect(afterIncorrect.streak).toBe(0);
    expect(afterIncorrect.level).toBeLessThanOrEqual(afterCorrect.level);
  });

  it("computes mastery metrics", () => {
    const state = { ...createInitialAlcumusState(pool), level: 3, solved: 4 };
    expect(masteryPercent(state)).toBeGreaterThan(0);
    expect(masteryPercent(state)).toBeLessThanOrEqual(100);
    expect(masteryStepLabel(state)).toContain("Level 3");
  });

  it("handles empty pool for apply without advancing", () => {
    const state = {
      level: 1 as const,
      problemId: "",
      streak: 0,
      solved: 0,
      feedback: null,
      feedbackTone: null,
      toast: null,
    };
    expect(applyAlcumusCorrect([], state)).toEqual(state);
    expect(applyAlcumusIncorrect([], state)).toEqual(state);
  });
});
