import { describe, expect, it } from "vitest";

import { getOrCreateAssignmentQuestions } from "@/lib/student/assignment-selection";
import { makeChapterChoice } from "../../helpers/factories";

describe("assignment selection", () => {
  const bank = [
    makeChapterChoice({ id: "e1", difficulty: 1 }),
    makeChapterChoice({ id: "e2", difficulty: 1 }),
    makeChapterChoice({ id: "e3", difficulty: 2 }),
    makeChapterChoice({ id: "e4", difficulty: 2 }),
    makeChapterChoice({ id: "e5", difficulty: 2 }),
  ];

  it("keeps stable assignment sets per student", () => {
    const studentAFirst = getOrCreateAssignmentQuestions(
      "student-a",
      "course",
      "lesson",
      bank,
    );
    const studentASecond = getOrCreateAssignmentQuestions(
      "student-a",
      "course",
      "lesson",
      bank,
    );
    const studentB = getOrCreateAssignmentQuestions(
      "student-b",
      "course",
      "lesson",
      bank,
    );

    expect(studentAFirst.map((q) => q.id)).toEqual(studentASecond.map((q) => q.id));
    expect(studentB).toHaveLength(4);
  });
});
