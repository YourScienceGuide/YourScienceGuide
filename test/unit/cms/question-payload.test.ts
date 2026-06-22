import { describe, expect, it } from "vitest";

import {
  alcumusProblemToPayload,
  chapterQuestionToPayload,
  lessonQuestionToPayload,
  payloadToAlcumusProblem,
  payloadToChapterQuestion,
  payloadToLessonQuestion,
} from "@/lib/cms/question-payload";
import {
  makeChapterChoice,
  makeFillInBlank,
  makeMultipleChoice,
  makeShortAnswer,
} from "../../helpers/factories";

describe("CMS question payload round-trip", () => {
  it("round-trips multiple-choice assignment questions", () => {
    const original = makeMultipleChoice();
    const payload = lessonQuestionToPayload(original);
    const row = {
      course_id: "c1",
      lesson_id: "l1",
      question_id: original.id,
      sort_order: 0,
      question_type: original.type,
      prompt: original.prompt,
      payload,
    };
    const restored = payloadToLessonQuestion(row);
    expect(restored).toEqual(original);
  });

  it("round-trips short-answer and fill-in-blank", () => {
    const short = makeShortAnswer();
    expect(
      payloadToLessonQuestion({
        course_id: "c",
        lesson_id: "l",
        question_id: short.id,
        sort_order: 0,
        question_type: short.type,
        prompt: short.prompt,
        payload: lessonQuestionToPayload(short),
      }),
    ).toEqual(short);

    const fib = makeFillInBlank();
    expect(
      payloadToLessonQuestion({
        course_id: "c",
        lesson_id: "l",
        question_id: fib.id,
        sort_order: 0,
        question_type: fib.type,
        prompt: fib.prompt,
        payload: lessonQuestionToPayload(fib),
      }),
    ).toEqual(fib);
  });

  it("round-trips chapter questions with difficulty", () => {
    const original = makeChapterChoice({ difficulty: 4 });
    const payload = chapterQuestionToPayload(original);
    const restored = payloadToChapterQuestion({
      course_id: "c",
      lesson_id: "l",
      question_id: original.id,
      sort_order: 0,
      question_type: original.type,
      prompt: original.prompt,
      payload,
    });
    expect(restored).toEqual(original);
  });

  it("round-trips legacy alcumus choice and numeric problems", () => {
    const choice = {
      id: "p1",
      level: 3 as const,
      type: "choice" as const,
      prompt: "2+2?",
      options: ["3", "4"],
      correctIndex: 1,
    };
    expect(
      payloadToAlcumusProblem({
        course_id: "c",
        lesson_id: "l",
        id: choice.id,
        level: choice.level,
        problem_type: "choice",
        prompt: choice.prompt,
        hint: null,
        payload: alcumusProblemToPayload(choice),
      }),
    ).toMatchObject({
      id: choice.id,
      type: "choice",
      correctIndex: choice.correctIndex,
    });

    const numeric = {
      id: "p2",
      level: 4 as const,
      type: "numeric" as const,
      prompt: "pi?",
      acceptedAnswers: ["3.14"],
    };
    expect(
      payloadToAlcumusProblem({
        course_id: "c",
        lesson_id: "l",
        id: numeric.id,
        level: numeric.level,
        problem_type: "numeric",
        prompt: numeric.prompt,
        hint: "hint",
        payload: alcumusProblemToPayload(numeric),
      }).acceptedAnswers,
    ).toEqual(numeric.acceptedAnswers);
  });

  it("returns null for unknown assignment types", () => {
    expect(
      payloadToLessonQuestion({
        course_id: "c",
        lesson_id: "l",
        question_id: "x",
        sort_order: 0,
        question_type: "unknown",
        prompt: "?",
        payload: {},
      }),
    ).toBeNull();
  });
});
