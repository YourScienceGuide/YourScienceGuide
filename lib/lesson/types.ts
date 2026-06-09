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

export type LessonQuestion =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion;

export const LESSON_QUESTION_COUNT = 3;
