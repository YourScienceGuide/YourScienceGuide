import type { AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { LessonQuestion } from "@/lib/lesson/types";

export type CourseRow = {
  id: string;
  title: string;
  subject: string;
  description: string;
  sort_order: number;
};

export type LessonRow = {
  course_id: string;
  id: string;
  chapter_id: string;
  chapter_title: string;
  title: string;
  description: string;
  sort_order: number;
  csv_chapter: number | null;
  csv_section: number | null;
};

export type CourseTextbookRow = {
  course_id: string;
  title: string;
  subtitle: string;
  authors: string;
  edition: string;
  publisher: string;
  cover_url: string;
  cover_alt: string;
};

export type LessonVideoRow = {
  course_id: string;
  lesson_id: string;
  title: string;
  description: string;
  mux_playback_id: string | null;
  file_name: string | null;
};

export type AssignmentQuestionRow = {
  course_id: string;
  lesson_id: string;
  question_id: string;
  sort_order: number;
  question_type: string;
  prompt: string;
  payload: Record<string, unknown>;
};

export type AlcumusProblemRow = {
  course_id: string;
  lesson_id: string;
  id: string;
  level: number;
  problem_type: "choice" | "numeric";
  prompt: string;
  hint: string | null;
  payload: Record<string, unknown>;
};

export function lessonQuestionToPayload(question: LessonQuestion): Record<string, unknown> {
  switch (question.type) {
    case "multiple-choice":
      return { options: question.options, correctIndex: question.correctIndex };
    case "short-answer":
      return { acceptedAnswers: question.acceptedAnswers };
    case "long-answer":
      return { minLength: question.minLength };
    case "fill-in-the-blank":
      return { blankAnswers: question.blankAnswers };
    default:
      return {};
  }
}

export function payloadToLessonQuestion(row: AssignmentQuestionRow): LessonQuestion | null {
  const { question_type: type, question_id: id, prompt, payload } = row;

  switch (type) {
    case "multiple-choice":
      return {
        type,
        id,
        prompt,
        options: Array.isArray(payload.options) ? (payload.options as string[]) : [],
        correctIndex: typeof payload.correctIndex === "number" ? payload.correctIndex : 0,
      };
    case "short-answer":
      return {
        type,
        id,
        prompt,
        acceptedAnswers: Array.isArray(payload.acceptedAnswers)
          ? (payload.acceptedAnswers as string[])
          : [],
      };
    case "long-answer":
      return {
        type,
        id,
        prompt,
        minLength: typeof payload.minLength === "number" ? payload.minLength : 1,
      };
    case "fill-in-the-blank":
      return {
        type,
        id,
        prompt,
        blankAnswers: Array.isArray(payload.blankAnswers)
          ? (payload.blankAnswers as string[][])
          : [],
      };
    default:
      return null;
  }
}

export function alcumusProblemToPayload(problem: AlcumusProblem): Record<string, unknown> {
  if (problem.type === "choice") {
    return {
      options: problem.options ?? [],
      correctIndex: problem.correctIndex ?? 0,
    };
  }
  return { acceptedAnswers: problem.acceptedAnswers ?? [] };
}

export function payloadToAlcumusProblem(row: AlcumusProblemRow): AlcumusProblem {
  const { payload } = row;
  if (row.problem_type === "choice") {
    return {
      id: row.id,
      level: row.level as AlcumusProblem["level"],
      prompt: row.prompt,
      type: "choice",
      hint: row.hint ?? undefined,
      options: Array.isArray(payload.options) ? (payload.options as string[]) : [],
      correctIndex: typeof payload.correctIndex === "number" ? payload.correctIndex : 0,
    };
  }

  return {
    id: row.id,
    level: row.level as AlcumusProblem["level"],
    prompt: row.prompt,
    type: "numeric",
    hint: row.hint ?? undefined,
    acceptedAnswers: Array.isArray(payload.acceptedAnswers)
      ? (payload.acceptedAnswers as string[])
      : [],
  };
}
