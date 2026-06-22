import { describe, expect, it, vi } from "vitest";

import { shuffleMultipleChoice } from "@/lib/lesson/shuffle-multiple-choice";
import { makeMultipleChoice } from "../../helpers/factories";

describe("shuffleMultipleChoice", () => {
  it("preserves options and tracks correct index after shuffle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const question = makeMultipleChoice({
      options: ["A", "B", "C", "D"],
      correctIndex: 2,
    });

    const shuffled = shuffleMultipleChoice(question);
    expect(shuffled.options.sort()).toEqual(question.options.sort());
    expect(shuffled.options[shuffled.correctIndex]).toBe("C");
  });

  it("keeps correct answer aligned when order unchanged", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    const question = makeMultipleChoice({
      options: ["True", "False"],
      correctIndex: 0,
    });
    const shuffled = shuffleMultipleChoice(question);
    expect(shuffled.correctIndex).toBe(0);
    expect(shuffled.options[0]).toBe("True");
  });
});
