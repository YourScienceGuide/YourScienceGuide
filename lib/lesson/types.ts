export type MultipleChoiceQuestion = {
  type: "multiple-choice";
  id: "q1";
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type ShortAnswerQuestion = {
  type: "short-answer";
  id: "q2";
  prompt: string;
  acceptedAnswers: string[];
};

export type LongAnswerQuestion = {
  type: "long-answer";
  id: "q3";
  prompt: string;
  minLength: number;
};

export type LessonQuestion =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion;

export const LESSON_QUESTION_COUNT = 3;
