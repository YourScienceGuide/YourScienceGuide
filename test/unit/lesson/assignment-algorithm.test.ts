import { describe, expect, it } from "vitest";

import {
  normalizeAssignmentAlgorithm,
  DEFAULT_ASSIGNMENT_ALGORITHM,
  lessonUsesPriorReviewForMcFib,
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
    expect(normalizeAssignmentAlgorithm()).toEqual({
      ...DEFAULT_ASSIGNMENT_ALGORITHM,
      priorReviewChapterNumbers: [],
    });
  });

  it("allows zero preferred-pool take", () => {
    expect(
      normalizeAssignmentAlgorithm({ extraPrimaryPoolTake: 0 }).extraPrimaryPoolTake,
    ).toBe(0);
  });

  it("normalizes priorReviewChapterNumbers", () => {
    expect(
      normalizeAssignmentAlgorithm({
        priorReviewChapterNumbers: [7, 4, 4, 0, -1],
      }).priorReviewChapterNumbers,
    ).toEqual([4, 7]);
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

  it("draws MC/FIB from prior reviews when chapter is flagged", () => {
    const course = makeCourse({
      lessons: [
        {
          id: "early",
          chapterId: "c3",
          chapterTitle: "Chapter 3",
          title: "3.1",
          description: "",
          order: 1,
          chapter: 3,
          section: 1,
        },
        {
          id: "phil",
          chapterId: "c4",
          chapterTitle: "Philosophy of science",
          title: "4.1",
          description: "",
          order: 2,
          chapter: 4,
          section: 1,
        },
      ],
    });
    const store = makeStore({
      courses: [course],
      questionBank: {
        [lessonKey(course.id, "phil")]: [],
      },
      reviewQuestionsByLesson: {
        [lessonKey(course.id, "early")]: [
          makeMultipleChoice({ id: "rev-mc-1" }),
          makeMultipleChoice({ id: "rev-mc-2" }),
          makeMultipleChoice({ id: "rev-mc-3" }),
          {
            type: "fill-in-the-blank" as const,
            id: "rev-fib-1",
            prompt: "Blank?",
            acceptedAnswers: ["answer"],
          },
        ],
      },
    });

    expect(
      lessonUsesPriorReviewForMcFib(
        normalizeAssignmentAlgorithm({ priorReviewChapterNumbers: [4] }),
        course.lessons[1],
      ),
    ).toBe(true);

    const plan = buildLessonAssessmentPlan(
      store,
      course,
      course.lessons[1],
      {
        ...DEFAULT_GRADING_RUBRIC,
        mcBankSize: 2,
        fibCount: 1,
        reviewCount: 0,
      },
      { priorReviewChapterNumbers: [4] },
    );

    expect(plan.multipleChoice).toHaveLength(2);
    expect(plan.multipleChoice.every((q) => q.id.startsWith("rev-mc-"))).toBe(
      true,
    );
    expect(plan.fillInBlank.map((q) => q.id)).toEqual(["rev-fib-1"]);

    const explanation = explainLessonAssessmentPlan(
      store,
      course,
      course.lessons[1],
      {
        ...DEFAULT_GRADING_RUBRIC,
        mcBankSize: 2,
        fibCount: 1,
        reviewCount: 0,
      },
      { priorReviewChapterNumbers: [4] },
    );
    expect(explanation.narrative.some((line) => /prior lessons/i.test(line))).toBe(
      true,
    );
    expect(
      explanation.phases.find((phase) => phase.id === "multiple-choice")?.sources[0]
        ?.role,
    ).toBe("prior-review");
  });
});
