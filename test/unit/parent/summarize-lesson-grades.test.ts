import { describe, expect, it } from "vitest";

import { summarizeLessonGrades } from "@/lib/parent/summarize-lesson-grades";

describe("summarizeLessonGrades", () => {
  it("totals earned and possible points across lessons", () => {
    const summary = summarizeLessonGrades(
      [
        { earnedPoints: 12, possiblePoints: 20 },
        { earnedPoints: 8, possiblePoints: 15 },
      ],
      4,
    );

    expect(summary.totalEarnedPoints).toBe(20);
    expect(summary.totalPossiblePoints).toBe(35);
    expect(summary.courseProgress).toBe(50);
  });

  it("returns zero progress when no lessons exist", () => {
    expect(summarizeLessonGrades([], 0)).toEqual({
      totalEarnedPoints: 0,
      totalPossiblePoints: 0,
      courseProgress: 0,
    });
  });
});
