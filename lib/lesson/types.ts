export type MultipleChoiceQuestion = {
  type: "multiple-choice";
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type ShortAnswerQuestion = {
  type: "short-answer";
  id: string;
  prompt: string;
  acceptedAnswers: string[];
};

export type LongAnswerQuestion = {
  type: "long-answer";
  id: string;
  prompt: string;
  minLength: number;
};

export type FillInBlankQuestion = {
  type: "fill-in-the-blank";
  id: string;
  /** Sentence with blanks marked as four or more underscores (________). */
  prompt: string;
  /** Accepted answers per blank; each inner list allows spelling variants. */
  blankAnswers: string[][];
};

export type LessonQuestion =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | FillInBlankQuestion;

export const LESSON_QUESTION_COUNT = 3;
