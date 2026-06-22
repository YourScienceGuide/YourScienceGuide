import { describe, expect, it } from "vitest";

import {
  BLANK_PATTERN,
  checkBlankAnswer,
  checkFillInBlankQuestion,
  countBlanks,
  levenshtein,
  splitPromptOnBlanks,
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

describe("checkBlankAnswer", () => {
  const variants = ["photosynthesis", "Photosynthesis"];

  it("accepts exact matches", () => {
    expect(checkBlankAnswer(variants, "photosynthesis")).toBe("correct");
  });

  it("flags near-misses as spelling hints", () => {
    expect(checkBlankAnswer(variants, "photosyntesis")).toBe("spelling");
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

  it("returns spelling hint on near miss", () => {
    expect(checkFillInBlankQuestion(blankAnswers, ["H20", "oxygen"])).toEqual({
      correct: false,
      spellingHint: true,
    });
  });

  it("fails when blank count mismatches", () => {
    expect(checkFillInBlankQuestion(blankAnswers, ["h2o"])).toEqual({
      correct: false,
      spellingHint: false,
    });
  });
});
