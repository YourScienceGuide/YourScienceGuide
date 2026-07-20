import { describe, expect, it } from "vitest";

import {
  BLANK_PATTERN,
  checkBlankAnswer,
  checkFillInBlankQuestion,
  countBlanks,
  levenshtein,
  splitPromptOnBlanks,
  withinInsertDeleteBudget,
} from "@/lib/lesson/fill-in-blank";

describe("blank parsing", () => {
  it("counts and splits on four or more underscores", () => {
    expect(countBlanks("The ________ is vital.")).toBe(1);
    expect(countBlanks("A ________ and ________.")).toBe(2);
    expect(countBlanks("No blanks here")).toBe(0);

    expect(splitPromptOnBlanks("Hi ________ there")).toEqual(["Hi ", " there"]);
    expect(BLANK_PATTERN.test("____")).toBe(true);
    expect(BLANK_PATTERN.test("___")).toBe(false);
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("", "")).toBe(0);
    expect(levenshtein("cat", "cat")).toBe(0);
    expect(levenshtein("cat", "bat")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("withinInsertDeleteBudget", () => {
  it("allows exact matches", () => {
    expect(withinInsertDeleteBudget("cell", "cell", 1, 1)).toBe(true);
  });

  it("allows one insertion", () => {
    expect(withinInsertDeleteBudget("photosyntesis", "photosynthesis", 1, 1)).toBe(
      true,
    );
  });

  it("allows one deletion", () => {
    expect(withinInsertDeleteBudget("celll", "cell", 1, 1)).toBe(true);
  });

  it("allows one insertion and one deletion in either order", () => {
    // substitution via delete + insert
    expect(withinInsertDeleteBudget("h20", "h2o", 1, 1)).toBe(true);
    // different positions
    expect(withinInsertDeleteBudget("abcd", "abxd", 1, 1)).toBe(true);
    expect(withinInsertDeleteBudget("abxd", "abcd", 1, 1)).toBe(true);
  });

  it("rejects edits beyond one insert and one delete", () => {
    expect(withinInsertDeleteBudget("cat", "dog", 1, 1)).toBe(false);
    expect(withinInsertDeleteBudget("abc", "axy", 1, 1)).toBe(false);
    expect(withinInsertDeleteBudget("ab", "wxyz", 1, 1)).toBe(false);
  });
});

describe("checkBlankAnswer", () => {
  const variants = ["photosynthesis", "Photosynthesis"];

  it("accepts exact matches", () => {
    expect(checkBlankAnswer(variants, "photosynthesis")).toBe("correct");
  });

  it("accepts one insert and/or one delete as correct", () => {
    expect(checkBlankAnswer(variants, "photosyntesis")).toBe("correct");
    expect(checkBlankAnswer(["H2O"], "H20")).toBe("correct");
    expect(checkBlankAnswer(["cell"], "celll")).toBe("correct");
  });

  it("flags farther near-misses as spelling hints", () => {
    // Two missing letters ("th") — beyond one insert + one delete.
    expect(checkBlankAnswer(variants, "photosynesis")).toBe("spelling");
  });

  it("rejects empty or wrong answers", () => {
    expect(checkBlankAnswer(variants, "")).toBe("incorrect");
    expect(checkBlankAnswer(variants, "respiration")).toBe("incorrect");
  });
});

describe("checkFillInBlankQuestion", () => {
  const blankAnswers = [["H2O", "h2o"], ["oxygen", "O2"]];

  it("requires all blanks filled correctly", () => {
    expect(checkFillInBlankQuestion(blankAnswers, ["h2o", "oxygen"])).toEqual({
      correct: true,
      spellingHint: false,
    });
  });

  it("accepts one-insert/one-delete typos as correct", () => {
    expect(checkFillInBlankQuestion(blankAnswers, ["H20", "oxygen"])).toEqual({
      correct: true,
      spellingHint: false,
    });
  });

  it("fails when blank count mismatches", () => {
    expect(checkFillInBlankQuestion(blankAnswers, ["h2o"])).toEqual({
      correct: false,
      spellingHint: false,
    });
  });
});
