import { describe, expect, it } from "vitest";

import { buildLessonAssessmentPlan } from "@/lib/lesson/lesson-assessment-plan";
import { makeStore, makeCourse, makeMultipleChoice } from "../../helpers/factories";
import { lessonKey } from "@/lib/admin/lesson-key";
import { DEFAULT_GRADING_RUBRIC } from "@/lib/lesson/lesson-grade-config";

describe("lesson assessment plan", () => {
  it("selects question counts from rubric", () => {
    const course = makeCourse({
      lessons: [
        {
          id: "lesson-a",
          chapterId: "chapter-1",
          chapterTitle: "Chapter 1",
          title: "Lesson A",
          description: "",
          order: 1,
          chapter: 1,
          section: 1,
        },
      ],
    });
    const key = lessonKey(course.id, "lesson-a");
    const mc = Array.from({ length: 15 }, (_, i) =>
      makeMultipleChoice({ id: `mc-${i}` }),
    );
    const store = makeStore({
      courses: [course],
      questionBank: {
        [key]: mc.map((q) => ({ ...q, difficulty: 1 as const })),
      },
      reviewQuestionsByLesson: {
        [key]: Array.from({ length: 4 }, (_, i) =>
          makeMultipleChoice({ id: `rev-${i}` }),
        ),
      },
    });

    const plan = buildLessonAssessmentPlan(
      store,
      course,
      course.lessons[0],
      DEFAULT_GRADING_RUBRIC,
    );
    expect(plan.review).toHaveLength(4);
    expect(plan.multipleChoice).toHaveLength(15);
  });
});
