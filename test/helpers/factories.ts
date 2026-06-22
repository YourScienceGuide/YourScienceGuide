import type { AlcumusLevel } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
import type { LessonQuestion } from "@/lib/lesson/types";
import type { AdminContentStore } from "@/lib/admin/content-store";
import type { Course } from "@/lib/student/curriculum-types";
import { createDefaultStore } from "@/lib/admin/content-store";

export function makeMultipleChoice(
  overrides: Partial<Extract<LessonQuestion, { type: "multiple-choice" }>> = {},
): Extract<LessonQuestion, { type: "multiple-choice" }> {
  return {
    type: "multiple-choice",
    id: "q1",
    prompt: "Pick one",
    options: ["A", "B", "C"],
    correctIndex: 1,
    ...overrides,
  };
}

export function makeShortAnswer(
  overrides: Partial<Extract<LessonQuestion, { type: "short-answer" }>> = {},
): Extract<LessonQuestion, { type: "short-answer" }> {
  return {
    type: "short-answer",
    id: "q2",
    prompt: "Name it",
    acceptedAnswers: ["mitochondria", "Mitochondria"],
    ...overrides,
  };
}

export function makeFillInBlank(
  overrides: Partial<Extract<LessonQuestion, { type: "fill-in-the-blank" }>> = {},
): Extract<LessonQuestion, { type: "fill-in-the-blank" }> {
  return {
    type: "fill-in-the-blank",
    id: "q3",
    prompt: "Water is ________.",
    blankAnswers: [["H2O", "h2o"]],
    ...overrides,
  };
}

export function makeChapterChoice(
  overrides: Partial<ChapterQuestion> = {},
): ChapterQuestion {
  return {
    type: "multiple-choice",
    id: "p1",
    difficulty: 3,
    prompt: "2 + 2 = ?",
    options: ["3", "4"],
    correctIndex: 1,
    ...overrides,
  };
}

export function makeChapterNumeric(
  overrides: Partial<ChapterQuestion> = {},
): ChapterQuestion {
  return {
    type: "short-answer",
    id: "p2",
    difficulty: 4,
    prompt: "Enter pi to two decimals",
    acceptedAnswers: ["3.14"],
    ...overrides,
  };
}

/** @deprecated Use makeChapterChoice */
export function makeAlcumusChoice(
  overrides: Partial<{ id: string; level: AlcumusLevel; correctIndex: number }> = {},
): ChapterQuestion {
  const { level, ...rest } = overrides;
  return makeChapterChoice({
    id: rest.id,
    correctIndex: rest.correctIndex,
    difficulty: level ?? 3,
  });
}

/** @deprecated Use makeChapterNumeric */
export function makeAlcumusNumeric(
  overrides: Partial<{ id: string; level: AlcumusLevel; acceptedAnswers: string[] }> = {},
): ChapterQuestion {
  const { level, acceptedAnswers, ...rest } = overrides;
  return makeChapterNumeric({
    id: rest.id,
    acceptedAnswers,
    difficulty: level ?? 4,
  });
}

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "test-course",
    title: "Test Course",
    subject: "Science",
    description: "A test course",
    lessons: [
      {
        id: "lesson-a",
        chapterId: "chapter-1",
        chapterTitle: "Chapter 1",
        title: "Lesson A",
        description: "First lesson",
        order: 1,
        chapter: 1,
        section: 1,
      },
      {
        id: "lesson-b",
        chapterId: "chapter-1",
        chapterTitle: "Chapter 1",
        title: "Lesson B",
        description: "Second lesson",
        order: 2,
        chapter: 1,
        section: 2,
      },
    ],
    ...overrides,
  };
}

export function makeStore(overrides: Partial<AdminContentStore> = {}): AdminContentStore {
  const base = createDefaultStore();
  return { ...base, ...overrides };
}
