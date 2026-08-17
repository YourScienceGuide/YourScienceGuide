import { describe, expect, it } from "vitest";

import { correctOfCompleteLabel } from "@/lib/lesson/progress-labels";
import { reviewStepLabel } from "@/lib/lesson/review-labels";

describe("correctOfCompleteLabel", () => {
  it("labels correct vs complete counts, not bank size", () => {
    expect(correctOfCompleteLabel(3, 4)).toBe("3 correct of 4 complete");
    expect(correctOfCompleteLabel(5, 5)).toBe("5 correct of 5 complete");
  });
});

describe("reviewStepLabel", () => {
  it("uses correct/complete counts when review is finished", () => {
    expect(reviewStepLabel(3, 4, true, 3, 4)).toBe(
      "Review complete · 3 correct of 4 complete",
    );
  });
});
