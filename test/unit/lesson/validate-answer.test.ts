import { describe, expect, it } from "vitest";

import {
  checkFillInBlank,
  checkLongAnswer,
  checkMultipleChoice,
  checkShortAnswer,
  validateAnswer,
} from "@/lib/lesson/validate-answer";
import {
  makeFillInBlank,
  makeMultipleChoice,
  makeShortAnswer,
} from "../../helpers/factories";

describe("checkMultipleChoice", () => {
  const question = makeMultipleChoice({ correctIndex: 2 });

  it("returns true for the correct index", () => {
    expect(checkMultipleChoice(question, 2)).toBe(true);
  });

  it("returns false for wrong index or null", () => {
    expect(checkMultipleChoice(question, 0)).toBe(false);
    expect(checkMultipleChoice(question, null)).toBe(false);
  });
});

describe("checkShortAnswer", () => {
  const question = makeShortAnswer({
    acceptedAnswers: ["ATP", "adenosine triphosphate"],
  });

  it("matches case-insensitively with whitespace normalized", () => {
    expect(checkShortAnswer(question, "  atp  ")).toBe(true);
    expect(checkShortAnswer(question, "Adenosine Triphosphate")).toBe(true);
  });

  it("rejects unknown answers", () => {
    expect(checkShortAnswer(question, "glucose")).toBe(false);
  });
});

describe("checkLongAnswer", () => {
  it("requires minimum trimmed length", () => {
    const question = {
      type: "long-answer" as const,
      id: "la1",
      prompt: "Explain",
      minLength: 10,
    };
    expect(checkLongAnswer(question, "short")).toBe(false);
    expect(checkLongAnswer(question, "long enough")).toBe(true);
  });
});

describe("checkFillInBlank", () => {
  it("delegates to fill-in-blank checker", () => {
    const question = makeFillInBlank();
    expect(checkFillInBlank(question, ["H2O"]).correct).toBe(true);
    expect(checkFillInBlank(question, ["wrong"]).correct).toBe(false);
  });
});

describe("validateAnswer", () => {
  it("routes by question type", () => {
    expect(
      validateAnswer(makeMultipleChoice(), { selectedIndex: 1 }),
    ).toBe(true);
    expect(
      validateAnswer(makeShortAnswer(), { text: "mitochondria" }),
    ).toBe(true);
    expect(
      validateAnswer(makeFillInBlank(), { blanks: ["h2o"] }),
    ).toBe(true);
  });
});
