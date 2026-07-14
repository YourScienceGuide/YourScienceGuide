import type { AlcumusLevel, AlcumusProblem } from "@/lib/lesson/alcumus-types";
import type { ChapterQuestion } from "@/lib/lesson/chapter-questions";
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
  access_tier: "preview" | "subscriber" | null;
  graduation_problem_count: number | null;
  parent_engagement_prompt: string | null;
  free_response_rubric: string | null;
};

export type CourseGradingConfigRow = {
  course_id: string;
  review_count: number;
  review_points_each: number;
  mc_bank_size: number;
  mc_target_correct: number;
  mc_points_each: number;
  fib_count: number;
  fib_points_each: number;
  extra_count: number;
  extra_points_each: number;
  free_response_count: number;
  free_response_points: number;
  default_graduation_problem_count: number;
  algorithm_config?: Record<string, unknown> | null;
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
  const hint = question.hint?.trim();
  const withHint = (payload: Record<string, unknown>) =>
    hint ? { ...payload, hint } : payload;

  switch (question.type) {
    case "multiple-choice":
      return withHint({ options: question.options, correctIndex: question.correctIndex });
    case "short-answer":
      return withHint({ acceptedAnswers: question.acceptedAnswers });
    case "long-answer":
      return withHint({ minLength: question.minLength });
    case "fill-in-the-blank":
      return withHint({ blankAnswers: question.blankAnswers });
    default:
      return hint ? { hint } : {};
  }
}

function readDifficulty(payload: Record<string, unknown>): AlcumusLevel {
  const level = payload.difficulty;
  if (typeof level === "number" && level >= 1 && level <= 5) {
    return level as AlcumusLevel;
  }
  return 1;
}

export function chapterQuestionToPayload(question: ChapterQuestion): Record<string, unknown> {
  return {
    ...lessonQuestionToPayload(question),
    difficulty: question.difficulty,
  };
}

export function payloadToChapterQuestion(row: AssignmentQuestionRow): ChapterQuestion | null {
  const lesson = payloadToLessonQuestion(row);
  if (!lesson) return null;
  return {
    ...lesson,
    difficulty: readDifficulty(row.payload),
  };
}

export function payloadToLessonQuestion(row: AssignmentQuestionRow): LessonQuestion | null {
  const { question_type: type, question_id: id, prompt, payload } = row;
  const hint =
    typeof payload.hint === "string" && payload.hint.trim()
      ? payload.hint.trim()
      : undefined;

  switch (type) {
    case "multiple-choice":
      return {
        type,
        id,
        prompt,
        hint,
        options: Array.isArray(payload.options) ? (payload.options as string[]) : [],
        correctIndex: typeof payload.correctIndex === "number" ? payload.correctIndex : 0,
      };
    case "short-answer":
      return {
        type,
        id,
        prompt,
        hint,
        acceptedAnswers: Array.isArray(payload.acceptedAnswers)
          ? (payload.acceptedAnswers as string[])
          : [],
      };
    case "long-answer":
      return {
        type,
        id,
        prompt,
        hint,
        minLength: typeof payload.minLength === "number" ? payload.minLength : 1,
      };
    case "fill-in-the-blank":
      return {
        type,
        id,
        prompt,
        hint,
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
