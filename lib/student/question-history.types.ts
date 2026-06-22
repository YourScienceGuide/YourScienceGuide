export type QuestionActivity = "assignment" | "alcumus";

export type QuestionAttemptRecord = {
  id: string;
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  questionId: string;
  activity: QuestionActivity;
  questionType: string;
  promptExcerpt: string;
  isCorrect: boolean;
  createdAt: string;
};

export type QuestionAttemptSummary = {
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracyPercent: number;
};

export type RecordQuestionAttemptInput = {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  questionId: string;
  activity: QuestionActivity;
  questionType: string;
  promptExcerpt: string;
  isCorrect: boolean;
};

export function summarizeAttempts(
  attempts: Pick<QuestionAttemptRecord, "isCorrect">[],
): QuestionAttemptSummary {
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracyPercent =
    totalAttempts === 0
      ? 0
      : Math.round((correctAttempts / totalAttempts) * 100);

  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    accuracyPercent,
  };
}

export function excerptPrompt(prompt: string, maxLength = 120): string {
  const trimmed = prompt.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
