import { describe, expect, it } from "vitest";

import {
  normalizeAssignmentAlgorithm,
  DEFAULT_ASSIGNMENT_ALGORITHM,
} from "@/lib/lesson/assignment-algorithm-config";
import { explainLessonAssessmentPlan } from "@/lib/lesson/assessment-plan-explain";
import { buildLessonAssessmentPlan } from "@/lib/lesson/lesson-assessment-plan";
import { DEFAULT_GRADING_RUBRIC } from "@/lib/lesson/lesson-grade-config";
import { lessonKey } from "@/lib/admin/lesson-key";
import {
  makeCourse,
  makeMultipleChoice,
  makeStore,
} from "../../helpers/factories";

describe("normalizeAssignmentAlgorithm", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeAssignmentAlgorithm()).toEqual(DEFAULT_ASSIGNMENT_ALGORITHM);
  });

  it("allows zero preferred-pool take", () => {
    expect(
      normalizeAssignmentAlgorithm({ extraPrimaryPoolTake: 0 }).extraPrimaryPoolTake,
    ).toBe(0);
  });
});

describe("assessment plan with algorithm config", () => {
  it("respects extraPrimaryPoolTake", () => {
    const course = makeCourse({
      lessons: [
        {
          id: "l1",
          chapterId: "c1",
          chapterTitle: "Chapter 1",
          title: "1.1",
          description: "",
          order: 1,
          chapter: 1,
          section: 1,
        },
        {
          id: "l2",
          chapterId: "c1",
          chapterTitle: "Chapter 1",
          title: "1.2",
          description: "",
          order: 2,
          chapter: 1,
          section: 2,
        },
      ],
    });
    const store = makeStore({
      courses: [course],
      questionBank: {
        [lessonKey(course.id, "l1")]: [
          makeMultipleChoice({ id: "a1" }),
          makeMultipleChoice({ id: "a2" }),
          makeMultipleChoice({ id: "a3" }),
        ].map((q) => ({ ...q, difficulty: 1 as const })),
        [lessonKey(course.id, "l2")]: [
          makeMultipleChoice({ id: "b1" }),
        ].map((q) => ({ ...q, difficulty: 1 as const })),
      },
    });

    const plan = buildLessonAssessmentPlan(
      store,
      course,
      course.lessons[1],
      { ...DEFAULT_GRADING_RUBRIC, extraCount: 2 },
      { extraPrimaryPoolTake: 1 },
    );
    expect(plan.extraPractice).toHaveLength(2);

    const explanation = explainLessonAssessmentPlan(
      store,
      course,
      course.lessons[1],
      { ...DEFAULT_GRADING_RUBRIC, extraCount: 2 },
      { extraPrimaryPoolTake: 1 },
    );
    const extra = explanation.phases.find((phase) => phase.id === "extra-practice");
    expect(extra?.selected).toBe(2);
    expect(extra?.rule).toMatch(/earlier sections/i);
  });
});
