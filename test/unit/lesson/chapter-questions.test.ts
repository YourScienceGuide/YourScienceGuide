import { describe, expect, it } from "vitest";

import {
  MAX_END_OF_CHAPTER_QUESTIONS,
  previewChapterSplit,
  selectAssignmentQuestions,
  selectPracticeQuestions,
  splitChapterBank,
} from "@/lib/lesson/chapter-questions";
import { makeChapterChoice, makeChapterNumeric } from "../../helpers/factories";

describe("chapter question split", () => {
  const bank = [
    makeChapterChoice({ id: "e1", difficulty: 1 }),
    makeChapterChoice({ id: "e2", difficulty: 2 }),
    makeChapterChoice({ id: "e3", difficulty: 1 }),
    makeChapterChoice({ id: "e4", difficulty: 2 }),
    makeChapterChoice({ id: "e5", difficulty: 1 }),
    makeChapterNumeric({ id: "h1", difficulty: 4 }),
    makeChapterNumeric({ id: "h2", difficulty: 5 }),
  ];

  it("caps assignment selection at four easy questions", () => {
    const assignment = selectAssignmentQuestions(bank, "seed-a");
    expect(assignment).toHaveLength(MAX_END_OF_CHAPTER_QUESTIONS);
    assignment.forEach((q) => {
      expect(["e1", "e2", "e3", "e4", "e5"]).toContain(q.id);
    });
  });

  it("is deterministic for the same seed", () => {
    const first = selectAssignmentQuestions(bank, "biology/lesson-1");
    const second = selectAssignmentQuestions(bank, "biology/lesson-1");
    expect(first.map((q) => q.id)).toEqual(second.map((q) => q.id));
  });

  it("puts unselected easy and all hard questions in practice", () => {
    const { assignment, practice } = splitChapterBank(bank, "seed-b");
    expect(assignment).toHaveLength(MAX_END_OF_CHAPTER_QUESTIONS);
    expect(practice.length).toBe(bank.length - assignment.length);
    expect(practice.some((q) => q.id === "h1")).toBe(true);
    assignment.forEach((q) => {
      expect(practice.some((p) => p.id === q.id)).toBe(false);
    });
  });

  it("previews assignment and practice counts", () => {
    const preview = previewChapterSplit(bank);
    expect(preview.assignmentCandidates).toBe(5);
    expect(preview.assignmentSlots).toBe(4);
    expect(preview.practiceCount).toBe(3);
  });

  it("routes leftover easy questions to practice", () => {
    const assignment = selectAssignmentQuestions(bank, "seed-c");
    const practice = selectPracticeQuestions(bank, assignment);
    const leftoverEasy = practice.filter((q) => q.difficulty <= 2);
    expect(leftoverEasy.length).toBe(1);
  });
});
