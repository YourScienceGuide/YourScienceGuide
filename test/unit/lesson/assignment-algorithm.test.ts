import { describe, expect, it } from "vitest";

import {
  normalizeAssignmentAlgorithm,
  DEFAULT_ASSIGNMENT_ALGORITHM,
  lessonUsesPriorReviewForMcFib,
  lessonIsReviewOnly,
  resolveRubricForChapter,
  setChapterOverride,
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
      chapterOverrides: {},
    });
  });

  it("allows zero preferred-pool take", () => {
    expect(
      normalizeAssignmentAlgorithm({ extraPrimaryPoolTake: 0 }).extraPrimaryPoolTake,
    ).toBe(0);
  });

  it("migrates legacy priorReviewChapterNumbers into chapterOverrides", () => {
    const normalized = normalizeAssignmentAlgorithm({
      priorReviewChapterNumbers: [7, 4, 4],
    });
    expect(normalized.priorReviewChapterNumbers).toEqual([4, 7]);
    expect(normalized.chapterOverrides["4"]?.usePriorReviewsForMcFib).toBe(true);
    expect(normalized.chapterOverrides["7"]?.usePriorReviewsForMcFib).toBe(true);
  });
});

describe("chapter overrides", () => {
  it("increases review count for a specific chapter", () => {
    const algorithm = setChapterOverride(normalizeAssignmentAlgorithm(), 4, {
      reviewCount: 8,
    });
    const rubric = resolveRubricForChapter(DEFAULT_GRADING_RUBRIC, algorithm, 4);
    expect(rubric.reviewCount).toBe(8);
    expect(
      resolveRubricForChapter(DEFAULT_GRADING_RUBRIC, algorithm, 1).reviewCount,
    ).toBe(DEFAULT_GRADING_RUBRIC.reviewCount);
  });

  it("review-only chapters skip new question phases", () => {
    const course = makeCourse({
      lessons: [
        {
          id: "phil",
          chapterId: "c4",
          chapterTitle: "Philosophy",
          title: "4.1",
          description: "",
          order: 1,
          chapter: 4,
          section: 1,
        },
      ],
    });
    const key = lessonKey(course.id, "phil");
    const store = makeStore({
      courses: [course],
      questionBank: {
        [key]: [
          makeMultipleChoice({ id: "mc-1" }),
          {
            type: "fill-in-the-blank" as const,
            id: "fib-1",
            prompt: "x",
            acceptedAnswers: ["y"],
          },
        ].map((q) =>
          q.type === "fill-in-the-blank"
            ? { ...q, difficulty: 1 as const }
            : { ...q, difficulty: 1 as const },
        ),
      },
      reviewQuestionsByLesson: {
        [key]: [
          makeMultipleChoice({ id: "rev-1" }),
          makeMultipleChoice({ id: "rev-2" }),
          makeMultipleChoice({ id: "rev-3" }),
        ],
      },
    });

    const algorithm = setChapterOverride(normalizeAssignmentAlgorithm(), 4, {
      reviewOnly: true,
      reviewCount: 3,
    });

    expect(lessonIsReviewOnly(algorithm, course.lessons[0])).toBe(true);

    const plan = buildLessonAssessmentPlan(
      store,
      course,
      course.lessons[0],
      DEFAULT_GRADING_RUBRIC,
      algorithm,
    );
    expect(plan.review).toHaveLength(3);
    expect(plan.multipleChoice).toHaveLength(0);
    expect(plan.fillInBlank).toHaveLength(0);
    expect(plan.extraPractice).toHaveLength(0);
    expect(plan.freeResponse).toBeNull();
  });

  it("draws MC/FIB from prior reviews when chapter override is set", () => {
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

    const algorithm = setChapterOverride(normalizeAssignmentAlgorithm(), 4, {
      usePriorReviewsForMcFib: true,
    });

    expect(lessonUsesPriorReviewForMcFib(algorithm, course.lessons[1])).toBe(true);

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
      algorithm,
    );

    expect(plan.multipleChoice).toHaveLength(2);
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
      algorithm,
    );
    expect(
      explanation.phases.find((phase) => phase.id === "multiple-choice")?.sources[0]
        ?.role,
    ).toBe("prior-review");
  });
});
