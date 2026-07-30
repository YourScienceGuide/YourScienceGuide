import { correctOfCompleteLabel } from "@/lib/lesson/progress-labels";

export function reviewStepLabel(
  questionIndex: number,
  questionCount: number,
  isComplete: boolean,
  correctCount?: number,
  completeCount?: number,
): string {
  if (questionCount <= 0) {
    return "No review questions";
  }
  if (isComplete) {
    const correct = correctCount ?? questionCount;
    const complete = completeCount ?? questionCount;
    return `Review complete · ${correctOfCompleteLabel(correct, complete)}`;
  }
  return `Review question ${questionIndex + 1} of ${questionCount}`;
}
