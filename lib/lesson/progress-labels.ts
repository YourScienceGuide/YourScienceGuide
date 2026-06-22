export function lessonStepLabel(
  questionIndex: number,
  assignmentCount: number,
  isComplete: boolean,
): string {
  if (assignmentCount <= 0) {
    return "No assignment questions";
  }
  if (isComplete) {
    return `Lesson complete · ${assignmentCount} of ${assignmentCount}`;
  }
  return `Question ${questionIndex + 1} of ${assignmentCount}`;
}
