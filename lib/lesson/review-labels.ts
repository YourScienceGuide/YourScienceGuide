export function reviewStepLabel(
  questionIndex: number,
  questionCount: number,
  isComplete: boolean,
): string {
  if (questionCount <= 0) {
    return "No review questions";
  }
  if (isComplete) {
    return `Review complete · ${questionCount} of ${questionCount}`;
  }
  return `Review question ${questionIndex + 1} of ${questionCount}`;
}
