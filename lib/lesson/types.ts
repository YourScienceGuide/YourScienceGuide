export type MultipleChoiceQuestion = {
  type: "multiple-choice";
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint?: string;
};

export type ShortAnswerQuestion = {
  type: "short-answer";
  id: string;
  prompt: string;
  acceptedAnswers: string[];
  hint?: string;
};

export type LongAnswerQuestion = {
  type: "long-answer";
  id: string;
  prompt: string;
  minLength: number;
  hint?: string;
};

export type FillInBlankQuestion = {
  type: "fill-in-the-blank";
  id: string;
  /** Sentence with blanks marked as four or more underscores (________). */
  prompt: string;
  /** Accepted answers per blank; each inner list allows spelling variants. */
  blankAnswers: string[][];
  hint?: string;
};

export type LessonQuestion =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | FillInBlankQuestion;

export const MAX_END_OF_CHAPTER_QUESTIONS = 4;

/** @deprecated Use dynamic assignment length from chapter bank split. */
export const LESSON_QUESTION_COUNT = MAX_END_OF_CHAPTER_QUESTIONS;
